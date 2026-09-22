import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../config/pool.js';
import { FORMS_UPLOAD_DIR } from '../config/upload.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================
// HELPER — Resolve the physical file path for a form
// Tries multiple known locations
// ============================================
const resolveFormFilePath = (fileUrl) => {
  if (!fileUrl) return { found: null, candidates: [] };

  const candidates = [];

  // 1. /uploads/forms/xyz.pdf → backend/uploads/forms/xyz.pdf
  if (fileUrl.startsWith('/uploads/')) {
    candidates.push(path.join(__dirname, '..', fileUrl.replace(/^\//, '')));
  }

  // 2. /forms/xyz.pdf → frontend/public/forms/xyz.pdf
  if (fileUrl.startsWith('/forms/')) {
    candidates.push(
      path.join(
        __dirname,
        '..',
        '..',
        'frontend',
        'public',
        fileUrl.replace(/^\//, '')
      )
    );
  }

  // 3. Bare filename → backend/uploads/forms/xyz.pdf
  candidates.push(path.join(FORMS_UPLOAD_DIR, path.basename(fileUrl)));

  // 4. Bare filename → frontend/public/forms/xyz.pdf
  candidates.push(
    path.join(
      __dirname,
      '..',
      '..',
      'frontend',
      'public',
      'forms',
      path.basename(fileUrl)
    )
  );

  const found = candidates.find((p) => fs.existsSync(p));
  return { found, candidates };
};

// ============================================
// GET /api/forms
// List all forms (any authenticated user)
// ============================================
export const getAllForms = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         id,
         title,
         description,
         file_url,
         size,
         type,
         upload_date AS "uploadDate"
       FROM forms
       ORDER BY upload_date DESC, id DESC`
    );

    const forms = result.rows.map((f) => ({
      ...f,
      downloadUrl: f.file_url ? `/api/forms/${f.id}/download` : null,
    }));

    res.json(forms);
  } catch (error) {
    console.error('Get forms error:', error);
    res.status(500).json({ message: 'Server error loading forms.' });
  }
};

// ============================================
// GET /api/forms/:id/download
// Stream the PDF to the client (works with token in query string)
// ============================================
export const downloadForm = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const result = await pool.query(
      'SELECT id, title, file_url FROM forms WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Form not found.' });
    }

    const form = result.rows[0];
    const { found, candidates } = resolveFormFilePath(form.file_url);

    // Debug log
    console.log(`📄 Form #${id} ("${form.title}")`);
    console.log(`   file_url: ${form.file_url}`);
    candidates.forEach((c) =>
      console.log(`   ${fs.existsSync(c) ? '✅' : '❌'} ${c}`)
    );

    if (!found) {
      return res.status(404).json({
        message: 'File not found on server.',
        file_url: form.file_url,
        tried: candidates,
      });
    }

    // Get file stats for Content-Length
    const stats = fs.statSync(found);

    // Sanitize filename
    const downloadName = `${form.title.replace(/\s+/g, '-').toLowerCase()}.pdf`;

    // Set headers for inline display (opens in browser PDF viewer)
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', stats.size);
    res.setHeader('Content-Disposition', `inline; filename="${downloadName}"`);
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');

    // Stream the file
    const fileStream = fs.createReadStream(found);

    fileStream.on('error', (err) => {
      console.error('Stream error:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error streaming file.' });
      } else {
        res.end();
      }
    });

    fileStream.pipe(res);
  } catch (error) {
    console.error('Download form error:', error);
    if (!res.headersSent) {
      res.status(500).json({ message: 'Server error downloading form.' });
    }
  }
};

// ============================================
// POST /api/forms
// Upload a new form (staff/admin/ceo only)
// ============================================
export const createForm = async (req, res) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ message: 'Title is required.' });
  }

  if (!req.file) {
    return res.status(400).json({ message: 'PDF file is required.' });
  }

  try {
    const fileUrl = `/uploads/forms/${req.file.filename}`;

    // Human-readable size
    const sizeKb = Math.round(req.file.size / 1024);
    const sizeStr =
      sizeKb >= 1024
        ? `${(sizeKb / 1024).toFixed(1)} MB`
        : `${sizeKb} KB`;

    const result = await pool.query(
      `INSERT INTO forms (title, description, file_url, size, type)
       VALUES ($1, $2, $3, $4, 'PDF')
       RETURNING id, title, description, file_url, size, type,
                 upload_date AS "uploadDate"`,
      [title.trim(), description?.trim() || '', fileUrl, sizeStr]
    );

    // Audit log (non-blocking)
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_name, role, action, details, ip)
         VALUES ($1, $2, 'UPLOAD_FORM', $3, $4)`,
        [
          req.user.name || req.user.email,
          req.user.role,
          `Uploaded form: "${title}"`,
          req.ip || '127.0.0.1',
        ]
      );
    } catch (e) {
      /* ignore */
    }

    res.status(201).json({
      success: true,
      message: 'Form uploaded successfully.',
      form: result.rows[0],
    });
  } catch (error) {
    console.error('Create form error:', error);

    // Clean up uploaded file if DB insert failed
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlink(req.file.path, () => {});
    }

    res.status(500).json({ message: 'Server error uploading form.' });
  }
};

// ============================================
// DELETE /api/forms/:id
// Delete a form (admin/ceo only)
// ============================================
export const deleteForm = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const result = await pool.query(
      'SELECT file_url FROM forms WHERE id = $1',
      [id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Form not found.' });
    }

    const { file_url } = result.rows[0];

    // Try to delete the physical file
    const { found } = resolveFormFilePath(file_url);
    if (found && fs.existsSync(found)) {
      fs.unlinkSync(found);
    }

    // Delete from DB
    await pool.query('DELETE FROM forms WHERE id = $1', [id]);

    // Audit log
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_name, role, action, details, ip)
         VALUES ($1, $2, 'DELETE_FORM', $3, $4)`,
        [
          req.user.name || req.user.email,
          req.user.role,
          `Deleted form #${id}`,
          req.ip || '127.0.0.1',
        ]
      );
    } catch (e) {
      /* ignore */
    }

    res.json({ success: true, message: 'Form deleted.' });
  } catch (error) {
    console.error('Delete form error:', error);
    res.status(500).json({ message: 'Server error deleting form.' });
  }
};