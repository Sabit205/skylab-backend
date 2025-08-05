const Fee = require('../models/Fee');
const User = require('../models/User');
// We no longer need to import Class here as we will use populate
// const Class = require('../models/Class'); 

// @desc    Lookup a student by index number for fee collection
// @route   GET /fees/student-lookup/:indexNumber
// @access  Private (Admin)
exports.lookupStudent = async (req, res) => {
    try {
        // --- THE DEFINITIVE FIX IS HERE ---
        // 1. Find the student by their index number AND role.
        // 2. Use .populate() to automatically fetch the details of the class they are assigned to.
        const student = await User.findOne({ indexNumber: req.params.indexNumber, role: 'Student' })
            .populate('class', 'name'); // This tells Mongoose: "find the student, then go find the Class document that matches the 'class' field's ID, and give me back its 'name'".

        if (!student) {
            return res.status(404).json({ message: 'No student found with this index number.' });
        }

        // 3. Check if the student has a class assigned. The `populate` will result in `student.class` being null if no class is assigned.
        if (!student.class) {
             return res.status(404).json({ message: 'This student has not been assigned to a class.' });
        }
        
        // 4. Send back the correctly populated data.
        res.json({
            _id: student._id,
            fullName: student.fullName,
            indexNumber: student.indexNumber,
            // The class information is now guaranteed to be the student's actual class.
            class: { 
                _id: student.class._id, 
                name: student.class.name 
            },
        });
    } catch (error) {
        console.error("Error in lookupStudent:", error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Collect a new fee payment
// @route   POST /fees
// @access  Private (Admin)
exports.collectFee = async (req, res) => {
    const { studentId, classId, amount, months, notes, studentName, studentIndex, className } = req.body;
    const adminId = req.userInfo.id;

    if (!studentName || !studentIndex || !className) {
        return res.status(400).json({ message: 'Missing student or class details for historical record.' });
    }

    try {
        const fee = await Fee.create({
            student: studentId,
            class: classId,
            collectedBy: adminId,
            studentName,
            studentIndex,
            className,
            amount,
            months,
            notes,
        });
        
        const savedFee = await Fee.findById(fee._id).populate('collectedBy', 'fullName');
        res.status(201).json(savedFee);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Get fee payment history with filtering and pagination
// @route   GET /fees/history
// @access  Private (Admin)
exports.getFeeHistory = async (req, res) => {
    try {
        const { page = 1, limit = 10, indexNumber, month } = req.query;

        const query = {};
        if (indexNumber) {
            query.studentIndex = { $regex: indexNumber, $options: 'i' };
        }
        if (month) {
            query.months = month;
        }

        const fees = await Fee.find(query)
            .populate('collectedBy', 'fullName')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const count = await Fee.countDocuments(query);

        res.json({
            fees,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};