const Complaint = require('../models/Complaint');

exports.create = async (request, response, next) => {
  try {
    const complaint = await Complaint.create({ ...request.body, submittedBy: request.user.id });
    response.status(201).json({ status: 'success', data: { complaint } });
  } catch (error) {
    next(error);
  }
};

exports.listMine = async (request, response, next) => {
  try {
    const complaints = await Complaint.find({ submittedBy: request.user.id }).sort({ createdAt: -1 });
    response.status(200).json({ status: 'success', results: complaints.length, data: { complaints } });
  } catch (error) {
    next(error);
  }
};
