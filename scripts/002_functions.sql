-- Helper function: decrement product stock safely
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id UUID, p_quantity INT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products
  SET stock = GREATEST(0, stock - p_quantity)
  WHERE id = p_product_id;
END;
$$;

-- Helper function: increment coupon usage
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_coupon_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE coupons
  SET used_count = used_count + 1
  WHERE id = p_coupon_id;
END;
$$;

-- Allow anon/authenticated to call these functions
GRANT EXECUTE ON FUNCTION decrement_stock(UUID, INT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_coupon_usage(UUID) TO anon, authenticated, service_role;
