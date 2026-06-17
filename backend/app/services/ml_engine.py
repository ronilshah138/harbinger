import os
import pickle
import logging
import numpy as np
import pandas as pd
from datetime import datetime
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, mean_squared_error

from app.services.feature_engineering import build_feature_matrix, get_target
from app.database import get_db
from app.config import settings

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

MODEL_DIR = settings.MODEL_STORE_PATH
if not os.path.exists(MODEL_DIR):
    os.makedirs(MODEL_DIR, exist_ok=True)

HORIZON_HOURS = 24
MIN_TRAINING_ROWS = 48

FEATURE_COLUMNS = [
    'vessel_count', 'avg_speed', 'max_speed', 'min_speed', 
    'moving_vessel_ratio', 'route_congestion_score', 'speed_std',
    'price_lag_1h', 'price_lag_6h', 'price_lag_24h', 'price_lag_168h',
    'price_rolling_mean_24h', 'price_rolling_std_24h', 
    'price_rolling_mean_168h', 'volume_rolling_mean_24h'
]

def get_model_path(commodity: str) -> str:
    return os.path.join(MODEL_DIR, f"{commodity}.pkl")

def train_model(commodity: str) -> dict:
    try:
        df = build_feature_matrix(commodity, days=30)
        if len(df) < MIN_TRAINING_ROWS:
            raise ValueError(f"Not enough data to train {commodity}. Got {len(df)} rows, need {MIN_TRAINING_ROWS}.")
            
        target = get_target(df, HORIZON_HOURS)
        
        # Align df and target. Drop rows where target is NaN
        valid_idx = target.dropna().index
        target = target.loc[valid_idx]
        df = df.loc[valid_idx]
        
        X = df[FEATURE_COLUMNS].copy()
        X = X.fillna(0)
        y = target
        
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, shuffle=False)
        
        model = xgb.XGBRegressor(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            n_jobs=-1,
            objective='reg:squarederror'
        )
        
        model.fit(X_train, y_train)
        
        y_pred = model.predict(X_test)
        
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        mape = np.mean(np.abs((y_test - y_pred) / y_test)) * 100
        
        model_path = get_model_path(commodity)
        with open(model_path, "wb") as f:
            pickle.dump(model, f)
            
        confidence = float(max(0, 100 - mape))
        predicted_price = float(y_pred[-1])
        
        db = get_db()
        metadata = {
            "commodity": commodity,
            "model_version": datetime.utcnow().isoformat(),
            "predicted_price": predicted_price,
            "confidence": confidence,
            "horizon_hours": HORIZON_HOURS
        }
        db.table("predictions").insert(metadata).execute()
        
        logger.info(f"Trained {commodity} model: MAE={mae:.2f}, RMSE={rmse:.2f}, MAPE={mape:.2f}%")
        
        return {
            "commodity": commodity,
            "mae": mae,
            "rmse": rmse,
            "mape": mape,
            "training_rows": len(df),
            "model_path": model_path
        }
    except Exception as e:
        logger.error(f"Error training model for {commodity}: {e}")
        raise

def load_model(commodity: str):
    try:
        model_path = get_model_path(commodity)
        if not os.path.exists(model_path):
            return None
        with open(model_path, "rb") as f:
            return pickle.load(f)
    except Exception as e:
        logger.error(f"Error loading model for {commodity}: {e}")
        return None

def predict(commodity: str) -> dict:
    model = load_model(commodity)
    if model is None:
        raise ValueError(f"No trained model for {commodity}")
        
    df = build_feature_matrix(commodity, days=7)
    if df.empty:
        raise ValueError(f"No data available for predicting {commodity}")
        
    current_features = df[FEATURE_COLUMNS].iloc[-1:].fillna(0)
    
    predicted_price = float(model.predict(current_features)[0])
    
    db = get_db()
    confidence = 0.0
    try:
        response = db.table("predictions").select("confidence").eq("commodity", commodity).order("created_at", desc=True).limit(1).execute()
        if response.data:
            confidence = response.data[0].get("confidence", 0.0)
    except Exception as e:
        logger.warning(f"Could not retrieve confidence for {commodity}: {e}")
        
    current_price = float(df['price'].iloc[-1])
    price_change_pct = ((predicted_price - current_price) / current_price * 100)
    direction = "up" if predicted_price > current_price else "down"
    
    return {
        "commodity": commodity,
        "predicted_price": predicted_price,
        "confidence": float(confidence),
        "horizon_hours": HORIZON_HOURS,
        "current_price": current_price,
        "price_change_pct": price_change_pct,
        "direction": direction,
        "created_at": datetime.utcnow().isoformat()
    }

def train_all_commodities() -> list:
    from app.services.commodity_config import COMMODITY_TICKERS
    results = []
    for commodity in COMMODITY_TICKERS.keys():
        try:
            res = train_model(commodity)
            results.append(res)
        except ValueError as e:
            logger.warning(f"Skipping training for {commodity}: {e}")
            continue
        except Exception as e:
            logger.error(f"Error in train_all_commodities for {commodity}: {e}")
            continue
    return results
