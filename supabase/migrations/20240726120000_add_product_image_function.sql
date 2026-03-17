CREATE OR REPLACE FUNCTION add_product_image_and_update_primary(
  p_product_id UUID,
  p_cloudinary_public_id TEXT,
  p_url TEXT,
  p_width INT,
  p_height INT,
  p_is_primary BOOLEAN,
  p_display_order INT
)
RETURNS JSONB AS $$
DECLARE
  new_image product_images;
  should_be_primary BOOLEAN := p_is_primary;
  image_count INT;
BEGIN
  -- Contar cuántas imágenes existen para este producto
  SELECT COUNT(*) INTO image_count FROM product_images WHERE product_id = p_product_id;

  -- Si es la primera imagen (el contador es 0), forzar a que sea la primaria
  IF image_count = 0 THEN
    should_be_primary := TRUE;
  END IF;

  -- Si la nueva imagen es primaria, quitar la marca de primaria de las demás
  IF should_be_primary THEN
    UPDATE product_images
    SET is_primary = FALSE
    WHERE product_id = p_product_id AND is_primary = TRUE;
  END IF;

  -- Insertar la nueva imagen
  INSERT INTO product_images(product_id, cloudinary_public_id, url, width, height, is_primary, display_order)
  VALUES (p_product_id, p_cloudinary_public_id, p_url, p_width, p_height, should_be_primary, p_display_order)
  RETURNING * INTO new_image;

  -- Si la imagen insertada es la primaria, actualizar la tabla de productos
  IF should_be_primary THEN
    UPDATE products
    SET image_url = p_url
    WHERE id = p_product_id;
  END IF;

  -- Devolver la imagen recién creada como JSONB
  RETURN to_jsonb(new_image);

EXCEPTION
  WHEN OTHERS THEN
    -- En caso de cualquier error, registrarlo y re-lanzarlo
    RAISE WARNING '[FUNCTION ERROR] add_product_image_and_update_primary: % - % ', SQLSTATE, SQLERRM;
    RETURN jsonb_build_object('error', SQLERRM);
END;
$$ LANGUAGE plpgsql;
