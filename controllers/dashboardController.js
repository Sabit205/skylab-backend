const User = require('../models/User');
const Transaction = require('../models/Transaction');

exports.getStats = async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'Student' });
        const teacherCount = await User.countDocuments({ role: 'Teacher' });

        const financialData = await Transaction.aggregate([
            {
                $facet: {
                    totalRevenue: [
                        { $match: { type: 'Revenue' } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ],
                    totalExpenses: [
                        { $match: { type: 'Expense' } },
                        { $group: { _id: null, total: { $sum: '$amount' } } }
                    ],
                    monthlyBreakdown: [
                        {
                            $group: {
                                _id: { year: { $year: '$date' }, month: { $month: '$date' } },
                                revenue: { $sum: { $cond: [{ $eq: ['$type', 'Revenue'] }, '$amount', 0] } },
                                expenses: { $sum: { $cond: [{ $eq: ['$type', 'Expense'] }, '$amount', 0] } }
                            }
                        },
                        { $sort: { '_id.year': 1, '_id.month': 1 } }
                    ]
                }
            }
        ]);
        
        const totalRevenue = financialData[0].totalRevenue[0]?.total || 0;
        const totalExpenses = financialData[0].totalExpenses[0]?.total || 0;
        const profit = totalRevenue - totalExpenses;
        
        const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('-password');

        res.json({
            students: studentCount,
            teachers: teacherCount,
            revenue: totalRevenue,
            expenses: totalExpenses,
            profit: profit,
            recentUsers: recentUsers,
            monthlyBreakdown: financialData[0].monthlyBreakdown,
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error fetching stats', error: error.message });
    }
};