import pool from '../config/pool.js';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// 1. Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// 2. Configure Multer to use Cloudinary
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'kaliluni_announcements', // Folder name inside Cloudinary
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
  },
});

export const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
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
  const author = req.user ? req.user.name : 'Admin';
  
  // req.file.path contains the full Cloudinary URL
  const attachmentUrl = req.file ? req.file.path : null;

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
  
  const attachmentUrl = req.file ? req.file.path : undefined;

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