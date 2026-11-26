import pool from '../config/pool.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// 1. Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/announcements';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

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

// 2. Create Announcement
export const createAnnouncement = async (req, res) => {
  const { title, content, author, priority } = req.body;
  const attachmentUrl = req.file ? `/uploads/announcements/${req.file.filename}` : null;

  try {
    const result = await pool.query(
      `INSERT INTO announcements (title, content, author, priority, attachment_url, date)
       VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
      [title, content, author || 'Admin', priority || 'normal', attachmentUrl]
    );
    res.status(201).json({ success: true, announcement: result.rows[0] });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// 3. Get All Announcements (Farmers + Staff)
export const getAnnouncements = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM announcements ORDER BY date DESC');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// 4. Delete Announcement
export const deleteAnnouncement = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM announcements WHERE id = $1', [id]);
    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};