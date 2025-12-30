const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateUser } = require('../middleware/auth');

// DELETE /api/my-brackets/:bracketId - Delete a user's bracket
router.delete('/:bracketId', authenticateUser, async (req, res) => {
  const { bracketId } = req.params;
  
  try {
    console.log(`User ${req.user.email} attempting to delete bracket ${bracketId}`);
    
    // Verify bracket belongs to user
    const bracketCheck = await db.query(
      'SELECT id, bracket_name FROM brackets WHERE id = $1 AND user_id = $2',
      [bracketId, req.user.dbId]
    );

    if (bracketCheck.rowCount === 0) {
      console.log(`Bracket ${bracketId} not found for user ${req.user.email}`);
      return res.status(404).json({
        success: false,
        message: 'Bracket not found or you do not have permission to delete it'
      });
    }

    const bracketName = bracketCheck.rows[0].bracket_name;

    // Delete bracket (cascade will delete predictions automatically)
    const deleteResult = await db.query('DELETE FROM brackets WHERE id = $1 AND user_id = $2', [bracketId, req.user.dbId]);

    if (deleteResult.rowCount > 0) {
      console.log(`✅ Successfully deleted bracket "${bracketName}" (ID: ${bracketId}) for user ${req.user.email}`);
      res.json({
        success: true,
        message: `Bracket "${bracketName}" deleted successfully`,
        deleted_bracket: {
          id: bracketId,
          name: bracketName
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to delete bracket'
      });
    }

  } catch (error) {
    console.error('Error deleting bracket:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bracket',
      error: error.message
    });
  }
});

module.exports = router;