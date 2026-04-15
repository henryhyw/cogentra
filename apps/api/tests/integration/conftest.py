import os

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from oralv.db import Base


@pytest.fixture()
def db_session():
    database_url = os.getenv("TEST_DATABASE_URL")
    if not database_url:
        pytest.skip("TEST_DATABASE_URL is not configured")
    engine = create_engine(database_url, future=True)
    Base.metadata.create_all(bind=engine)
    with Session(engine) as session:
      yield session
    Base.metadata.drop_all(bind=engine)
