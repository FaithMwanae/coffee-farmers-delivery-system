import pool from '../config/pool.js';

// ============================================
// GET /api/announcements — list all
// ============================================
export const getAllAnnouncements = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM announcements ORDER BY date DESC, id DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get announcements error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ============================================
// POST /api/announcements — create
// ============================================
export const createAnnouncement = async (req, res) => {
  const { title, content, priority, author } = req.body;

  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required.' });
  }

  const cleanTitle = title.trim();
  const cleanContent = content.trim();
  const cleanPriority = priority === 'high' ? 'high' : 'normal';
  const cleanAuthor = author?.trim() || req.user.name || 'Management';

  try {
    const result = await pool.query(
      `INSERT INTO announcements (title, content, author, priority)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [cleanTitle, cleanContent, cleanAuthor, cleanPriority]
    );

    // Audit log
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_name, role, action, details, ip)
         VALUES ($1, $2, 'CREATE_ANNOUNCEMENT', $3, $4)`,
        [
          req.user.name || req.user.email,
          req.user.role,
          `Created announcement: "${cleanTitle}"`,
          req.ip || '127.0.0.1',
        ]
      );
    } catch (e) { /* non-blocking */ }

    res.status(201).json({
      success: true,
      message: 'Announcement published.',
      announcement: result.rows[0],
    });
  } catch (error) {
    console.error('Create announcement error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ============================================
// PUT /api/announcements/:id — update
// ============================================
export const updateAnnouncement = async (req, res) => {
  const id = Number(req.params.id);
  const { title, content, priority } = req.body;

  try {
    const result = await pool.query(
      `UPDATE announcements SET
        title = COALESCE($1, title),
        content = COALESCE($2, content),
        priority = COALESCE($3, priority)
       WHERE id = $4
       RETURNING *`,
      [title?.trim(), content?.trim(), priority, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    res.json({
      success: true,
      message: 'Announcement updated.',
      announcement: result.rows[0],
    });
  } catch (error) {
    console.error('Update announcement error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};

// ============================================
// DELETE /api/announcements/:id
// ============================================
export const deleteAnnouncement = async (req, res) => {
  const id = Number(req.params.id);

  try {
    const result = await pool.query(
      'DELETE FROM announcements WHERE id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Announcement not found.' });
    }

    res.json({ success: true, message: 'Announcement deleted.' });
  } catch (error) {
    console.error('Delete announcement error:', error);
    res.status(500).json({ message: 'Server error.' });
  }
};