import logging
from datetime import datetime, timedelta
import pandas as pd
import numpy as np
from app.database import get_db

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

COMMODITY_ROUTE_REGIONS = {
    "gold": {"min_lat": 22, "max_lat": 30, "min_lon": 48, "max_lon": 65},
    "silver": {"min_lat": 22, "max_lat": 30, "min_lon": 48, "max_lon": 65},
    "oil": {"min_lat": 22, "max_lat": 28, "min_lon": 48, "max_lon": 60},
    "copper": {"min_lat": 1, "max_lat": 6, "min_lon": 99, "max_lon": 105},
    "platinum": {"min_lat": -35, "max_lat": -25, "min_lon": 14, "max_lon": 35},
    "palladium": {"min_lat": -35, "max_lat": -25, "min_lon": 14, "max_lon": 35},
    "natural_gas": {"min_lat": 22, "max_lat": 28, "min_lon": 48, "max_lon": 60},
    "aluminum": {"min_lat": 1, "max_lat": 6, "min_lon": 99, "max_lon": 105},
    "wheat": {"min_lat": 30, "max_lat": 47, "min_lon": 28, "max_lon": 42},
    "corn": {"min_lat": 25, "max_lat": 35, "min_lon": -95, "max_lon": -80},
    "soybeans": {"min_lat": 25, "max_lat": 35, "min_lon": -95, "max_lon": -80},
}

def fetch_price_history(commodity: str, days: int = 30) -> pd.DataFrame:
    try:
        db = get_db()
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        response = db.table('prices').select('timestamp, price, volume').eq('commodity', commodity).gte('timestamp', cutoff_date.isoformat()).order('timestamp', desc=False).execute()
        
        data = response.data
        if not data:
            logger.info(f"No price history found for {commodity} in the last {days} days.")
            df = pd.DataFrame(columns=['price', 'volume'])
            df.index.name = 'timestamp'
            return df
            
        df = pd.DataFrame(data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        df.set_index('timestamp', inplace=True)
        return df
    except Exception as e:
        logger.error(f"Error fetching price history for {commodity}: {e}")
        return pd.DataFrame()

def fetch_vessel_signals(commodity: str, days: int = 30) -> pd.DataFrame:
    try:
        db = get_db()
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        bbox = COMMODITY_ROUTE_REGIONS.get(commodity, {
            "min_lat": -90, "max_lat": 90, "min_lon": -180, "max_lon": 180
        })
        
        response = db.table('vessels') \
            .select('timestamp, mmsi, speed, heading, lat, lon') \
            .gte('timestamp', cutoff_date.isoformat()) \
            .gte('lat', bbox['min_lat']) \
            .lte('lat', bbox['max_lat']) \
            .gte('lon', bbox['min_lon']) \
            .lte('lon', bbox['max_lon']) \
            .execute()
            
        data = response.data
        if not data:
            logger.info(f"No vessel signals found for {commodity} in the last {days} days.")
            return pd.DataFrame(columns=['timestamp', 'mmsi', 'speed', 'heading', 'lat', 'lon'])
            
        df = pd.DataFrame(data)
        df['timestamp'] = pd.to_datetime(df['timestamp'])
        return df
    except Exception as e:
        logger.error(f"Error fetching vessel signals for {commodity}: {e}")
        return pd.DataFrame()

def compute_shipping_features(vessel_df: pd.DataFrame, freq: str = "1h") -> pd.DataFrame:
    try:
        if vessel_df.empty:
            return pd.DataFrame(columns=['vessel_count', 'avg_speed', 'max_speed', 'min_speed', 'moving_vessel_ratio', 'route_congestion_score', 'speed_std'])
            
        df = vessel_df.set_index('timestamp')
        resampled = df.resample(freq)
        
        features = pd.DataFrame()
        features['vessel_count'] = resampled['mmsi'].nunique()
        features['avg_speed'] = resampled['speed'].mean()
        features['max_speed'] = resampled['speed'].max()
        features['min_speed'] = resampled['speed'].min()
        features['moving_vessel_ratio'] = resampled['speed'].apply(lambda x: (x > 1.0).sum() / len(x) if len(x) > 0 else 0.0)
        
        features['route_congestion_score'] = features['vessel_count'] / features['avg_speed']
        features['route_congestion_score'] = features['route_congestion_score'].replace([np.inf, -np.inf], 0).fillna(0)
        
        features['speed_std'] = resampled['speed'].std()
        
        return features
    except Exception as e:
        logger.error(f"Error computing shipping features: {e}")
        return pd.DataFrame()

def build_feature_matrix(commodity: str, days: int = 30) -> pd.DataFrame:
    try:
        price_df = fetch_price_history(commodity, days)
        vessel_df = fetch_vessel_signals(commodity, days)
        shipping_features = compute_shipping_features(vessel_df)
        
        if price_df.empty:
            logger.info(f"Price dataframe is empty for {commodity}, returning empty feature matrix.")
            return pd.DataFrame()
            
        df = price_df.join(shipping_features, how='left')
        
        shipping_cols = ['vessel_count', 'avg_speed', 'max_speed', 'min_speed', 'moving_vessel_ratio', 'route_congestion_score', 'speed_std']
        for col in shipping_cols:
            if col not in df.columns:
                df[col] = 0.0
        df[shipping_cols] = df[shipping_cols].fillna(0)
        
        df['price_lag_1h'] = df['price'].shift(1)
        df['price_lag_6h'] = df['price'].shift(6)
        df['price_lag_24h'] = df['price'].shift(24)
        df['price_lag_168h'] = df['price'].shift(168)
        
        df['price_rolling_mean_24h'] = df['price'].rolling(window=24).mean()
        df['price_rolling_std_24h'] = df['price'].rolling(window=24).std()
        df['price_rolling_mean_168h'] = df['price'].rolling(window=168).mean()
        
        df['volume_rolling_mean_24h'] = df['volume'].rolling(window=24).mean()
        
        df.dropna(subset=['price_lag_1h'], inplace=True)
        
        logger.info(f"Built feature matrix for {commodity}: {len(df)} rows, {len(df.columns)} columns")
        return df
    except Exception as e:
        logger.error(f"Error building feature matrix for {commodity}: {e}")
        return pd.DataFrame()

def get_target(df: pd.DataFrame, horizon_hours: int = 24) -> pd.Series:
    try:
        target = df['price'].shift(-horizon_hours)
        return target
    except Exception as e:
        logger.error(f"Error getting target: {e}")
        return pd.Series(dtype=float)
