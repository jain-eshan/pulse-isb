-- place_reviews: ISB cohort reviews for Discover listings
CREATE TABLE IF NOT EXISTS place_reviews (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  place_id    uuid        NOT NULL REFERENCES places(id) ON DELETE CASCADE,
  user_id     uuid        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating      integer     NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment     text,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (place_id, user_id)   -- one review per user per place
);

-- Row-level security
ALTER TABLE place_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reviews_read_all"   ON place_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own" ON place_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "reviews_update_own" ON place_reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "reviews_delete_own" ON place_reviews FOR DELETE USING (auth.uid() = user_id);
