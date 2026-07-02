-- Increase branding bucket file size limit from 10 MB to 15 MB

update storage.buckets
set file_size_limit = 15728640 -- 15 MB
where id = 'branding';
