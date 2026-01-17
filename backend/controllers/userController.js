import User from '../models/User.js';

export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Search query must be at least 2 characters long.'
      });
    }

    const searchTerm = query.trim().toLowerCase();
    const currentUserId = req.user._id;

    const users = await User.find({
      $and: [
        {
          $or: [
            { name: { $regex: searchTerm, $options: 'i' } },
            { email: { $regex: searchTerm, $options: 'i' } }
          ]
        },
        { _id: { $ne: currentUserId } }
      ]
    })
    .select('name email _id')
    .limit(20)
    .lean();

    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      name: user.name,
      email: user.email
    }));

    res.status(200).json({
      success: true,
      data: { users: formattedUsers }
    });
  } catch (error) {
    const statusCode = error.statusCode || 500;
    const message = error.message || 'Internal Server Error';
    res.status(statusCode).json({
      success: false,
      message
    });
  }
};
