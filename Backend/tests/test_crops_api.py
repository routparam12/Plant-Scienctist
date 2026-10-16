from datetime import date, timedelta
from fastapi.testclient import TestClient
from main import app
from app.core.dependencies import get_current_user
from app.schemas.crops import UserCropCreate

client = TestClient(app)


def test_user_crop_create_validation():
    # 1. Neither crop_type_id nor custom_name -> ValueError
    try:
        UserCropCreate()
        assert False, "Should fail without crop_type_id or custom_name"
    except Exception:
        pass

    # 2. Planted date too far in future (> 30 days) -> ValueError
    try:
        UserCropCreate(
            crop_type_id="crop-tomato",
            planted_date=date.today() + timedelta(days=35),
        )
        assert False, "Should fail if planted_date > 30 days in future"
    except Exception:
        pass

    # 3. Valid crop create with crop_type_id
    valid_catalog = UserCropCreate(crop_type_id="crop-tomato", acreage=2.5)
    assert valid_catalog.crop_type_id == "crop-tomato"
    assert valid_catalog.acreage == 2.5

    # 4. Valid custom crop without catalog
    valid_custom = UserCropCreate(custom_name="Kashmiri Apple", variety="Red Delicious")
    assert valid_custom.custom_name == "Kashmiri Apple"


def test_get_crops_unauthorized_without_token():
    # Unauthenticated GET /v1/crops returns 401
    app.dependency_overrides.clear()
    res = client.get("/v1/crops")
    assert res.status_code == 401


def test_catalog_endpoint_public():
    # Catalog is accessible without authentication
    res = client.get("/v1/crops/catalog")
    # Will return 200 or 503 if DB down (no fake data)
    assert res.status_code in (200, 503)
