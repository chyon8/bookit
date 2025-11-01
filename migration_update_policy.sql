CREATE POLICY "Allow authenticated users to insert and update books"
ON books
FOR ALL
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');