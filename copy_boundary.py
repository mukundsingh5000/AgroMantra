import os, json

# Read existing kangra_boundary.geojson and ensure it exists in backend/config and data/
if os.path.exists('kangra_boundary.geojson'):
    with open('kangra_boundary.geojson', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    os.makedirs('data', exist_ok=True)
    os.makedirs('backend/config', exist_ok=True)
    
    with open('data/kangra_boundary.geojson', 'w', encoding='utf-8') as f:
        json.dump(data, f)
        
    with open('backend/config/kangra_boundary.geojson', 'w', encoding='utf-8') as f:
        json.dump(data, f)
    
    print("Kangra boundary saved to data/ and backend/config/!")
