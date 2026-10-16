INSERT INTO public.book_copies (book_id, inventory_number, isavailable)
SELECT 
    b.id as book_id,
    -- Generamos un número de 6 dígitos único usando el ID del libro y el índice de la copia
    (100000 + (b.id * 10) + s.idx)::text as inventory_number,
    true as isavailable
FROM 
    generate_series(350, 501) AS b(id)
CROSS JOIN 
    generate_series(1, 9) AS s(idx);