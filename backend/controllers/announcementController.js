import pool from '../config/pool.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs'; // Added to fix the crash

// ============================================
// MULTER CONFIGURATION
// ============================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/announcements';
    // Create the directory if it doesn't exist
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Export the upload middleware so routes can use it
export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowed = /pdf|doc|docx|jpg|jpeg|png/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.test(ext)) cb(null, true);
    else cb(new Error('Only PDF, Word, and Image files are allowed.'));
  }
});

// ============================================
// GET ALL ANNOUNCEMENTS
// ============================================
export const getAllAnnouncements = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM announcements ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ============================================
// CREATE ANNOUNCEMENT
// ============================================
export const createAnnouncement = async (req, res) => {
  const { title, content, priority } = req.body;
  
  // Use the logged-in user's name as the author
  const author = req.user ? req.user.name : 'Admin';
  
  // Save the file path if a file was uploaded
  const attachmentUrl = req.file ? `/uploads/announcements/${req.file.filename}` : null;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO announcements (title, content, author, priority, attachment_url, date)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [title, content, author, priority || 'normal', attachmentUrl]
    );
    res.status(201).json({ success: true, announcement: result.rows[0] });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ============================================
// UPDATE ANNOUNCEMENT
// ============================================
export const updateAnnouncement = async (req, res) => {
  const { id } = req.params;
  const { title, content, priority } = req.body;
  
  const attachmentUrl = req.file ? `/uploads/announcements/${req.file.filename}` : undefined;

  try {
    const result = await pool.query(
      `UPDATE announcements 
       SET title = COALESCE($1, title),
           content = COALESCE($2, content),
           priority = COALESCE($3, priority),
           attachment_url = COALESCE($4, attachment_url)
       WHERE id = $5 RETURNING *`,
      [title, content, priority, attachmentUrl, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    res.json({ success: true, announcement: result.rows[0] });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ============================================
// DELETE ANNOUNCEMENT
// ============================================
export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};