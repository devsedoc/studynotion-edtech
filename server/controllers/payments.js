
const { instance } = require("../config/razorpay");
const Course = require("../models/Course");
const crypto = require("crypto");
const User = require("../models/User");
const mailSender = require("../utils/mailSender");
const mongoose = require("mongoose");

const {
  courseEnrollmentEmail,
} = require("../mail/templates/courseEnrollmentEmail");

const {
  paymentSuccessEmail,
} = require("../mail/templates/paymentSuccessEmail");

const CourseProgress = require("../models/CourseProgress");

// Check whether payment configuration is available
const isPaymentConfigured = () => {
  return Boolean(
    instance &&
    process.env.RAZORPAY_KEY &&
    process.env.RAZORPAY_SECRET
  );
};

// Capture payment and initiate a Razorpay order
exports.capturePayment = async (req, res) => {
  if (!isPaymentConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Payment service is not configured",
    });
  }

  try {
    const { courses } = req.body;
    const userId = req.user?.id;

    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide course IDs",
      });
    }

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    let totalAmount = 0;

    for (const courseId of courses) {
      if (!mongoose.Types.ObjectId.isValid(courseId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid course ID",
        });
      }

      const course = await Course.findById(courseId);

      if (!course) {
        return res.status(404).json({
          success: false,
          message: "Could not find the course",
        });
      }

      const alreadyEnrolled = course.studentsEnroled.some(
        (studentId) => studentId.toString() === userId.toString()
      );

      if (alreadyEnrolled) {
        return res.status(400).json({
          success: false,
          message: "Student is already enrolled",
        });
      }

      if (!Number.isFinite(course.price) || course.price < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid course price",
        });
      }

      totalAmount += course.price;
    }

    const options = {
      amount: Math.round(totalAmount * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const paymentResponse = await instance.orders.create(options);

    return res.status(200).json({
      success: true,
      data: paymentResponse,
    });
  } catch (error) {
    console.error("Payment order creation failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not initiate order",
    });
  }
};

// Verify payment signature
exports.verifyPayment = async (req, res) => {
  if (!isPaymentConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Payment service is not configured",
    });
  }

  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      courses,
    } = req.body;

    const userId = req.user?.id;

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !Array.isArray(courses) ||
      courses.length === 0 ||
      !userId
    ) {
      return res.status(400).json({
        success: false,
        message: "Missing payment details",
      });
    }

    const body = `${razorpay_order_id}|${razorpay_payment_id}`;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET)
      .update(body)
      .digest();

    let receivedSignature;

    try {
      receivedSignature = Buffer.from(razorpay_signature, "hex");
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    if (
      receivedSignature.length !== expectedSignature.length ||
      !crypto.timingSafeEqual(expectedSignature, receivedSignature)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment verification failed",
      });
    }

    // IMPORTANT:
    // Before production use, verify through Razorpay's API that this
    // order belongs to this user, has the expected amount and currency,
    // and that the payment is captured. Also make enrollment idempotent.
    await enrollStudents(courses, userId);

    return res.status(200).json({
      success: true,
      message: "Payment signature verified",
    });
  } catch (error) {
    console.error("Payment verification failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not verify payment",
    });
  }
};

// Send payment success email
exports.sendPaymentSuccessEmail = async (req, res) => {
  if (!isPaymentConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Payment service is not configured",
    });
  }

  try {
    const { orderId, paymentId, amount } = req.body;
    const userId = req.user?.id;

    if (
      !orderId ||
      !paymentId ||
      amount == null ||
      !Number.isFinite(Number(amount)) ||
      !userId
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all the details",
      });
    }

    const enrolledStudent = await User.findById(userId);

    if (!enrolledStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    await mailSender(
      enrolledStudent.email,
      "Payment Received",
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        Number(amount) / 100,
        orderId,
        paymentId
      )
    );

    return res.status(200).json({
      success: true,
      message: "Payment email sent",
    });
  } catch (error) {
    console.error("Payment email failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Could not send payment email",
    });
  }
};

// Enroll student in courses after payment verification
const enrollStudents = async (courses, userId) => {
  if (!Array.isArray(courses) || !courses.length || !userId) {
    throw new Error("Please provide course IDs and user ID");
  }

  for (const courseId of courses) {
    if (!mongoose.Types.ObjectId.isValid(courseId)) {
      throw new Error("Invalid course ID");
    }

    const enrolledCourse = await Course.findById(courseId);

    if (!enrolledCourse) {
      throw new Error("Course not found");
    }

    const alreadyEnrolled = enrolledCourse.studentsEnroled.some(
      (studentId) => studentId.toString() === userId.toString()
    );

    if (alreadyEnrolled) {
      continue;
    }

    const courseProgress = await CourseProgress.create({
      courseID: courseId,
      userId,
      completedVideos: [],
    });

    await Course.findByIdAndUpdate(courseId, {
      $addToSet: {
        studentsEnroled: userId,
      },
    });

    await User.findByIdAndUpdate(userId, {
      $addToSet: {
        courses: courseId,
        courseProgress: courseProgress._id,
      },
    });

    const enrolledStudent = await User.findById(userId);

    if (enrolledStudent) {
      try {
        await mailSender(
          enrolledStudent.email,
          `Successfully Enrolled into ${enrolledCourse.courseName}`,
          courseEnrollmentEmail(
            enrolledCourse.courseName,
            `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
          )
        );
      } catch (emailError) {
        // Email failure should not undo a successful enrollment.
        console.error(
          "Enrollment email failed:",
          emailError.message
        );
      }
    }
  }
};
