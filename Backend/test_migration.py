from app.core.supabase import supabase

def run_tests():
    print("=== 1. TESTING CROPS TABLE ===")
    crops_res = supabase.table("crops").select("id, name, growth_duration_days, stages").execute()
    print(f"Total Seeded Crops: {len(crops_res.data)}")
    for c in crops_res.data:
        stages_count = len(c.get("stages") or [])
        print(f"  • {c['id']}: {c['name']} ({c['growth_duration_days']} days, {stages_count} stages)")

    print("\n=== 2. TESTING PROFILES TABLE ===")
    profiles_res = supabase.table("profiles").select("id").limit(5).execute()
    print(f"Profiles Table Accessible: True (Rows: {len(profiles_res.data)})")

    print("\n=== 3. TESTING FARMS & FARM_CROPS TABLES ===")
    farms_res = supabase.table("farms").select("id").limit(1).execute()
    print(f"Farms Table Accessible: True (Rows: {len(farms_res.data)})")
    farm_crops_res = supabase.table("farm_crops").select("id").limit(1).execute()
    print(f"Farm Crops Table Accessible: True (Rows: {len(farm_crops_res.data)})")

    print("\n=== 4. TESTING TASKS & DIAGNOSES TABLES ===")
    tasks_res = supabase.table("farm_crop_tasks").select("id").limit(1).execute()
    print(f"Tasks Table Accessible: True (Rows: {len(tasks_res.data)})")
    diagnoses_res = supabase.table("diagnoses").select("id").limit(1).execute()
    print(f"Diagnoses Table Accessible: True (Rows: {len(diagnoses_res.data)})")

    print("\n=== 5. TESTING STORAGE BUCKET ===")
    bucket = supabase.storage.get_bucket("crop-images")
    print(f"Storage Bucket 'crop-images' Exists: True (id: {bucket.id}, public: {bucket.public})")

    print("\n========================================================")
    print("SUCCESS: ALL 6 TABLES & STORAGE BUCKET VERIFIED IN SUPABASE!")
    print("========================================================")

if __name__ == "__main__":
    run_tests()
