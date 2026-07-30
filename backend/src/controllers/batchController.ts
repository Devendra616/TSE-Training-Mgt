import { Request, Response } from "express";
import {
  Batch,
  Training,
  BatchEmployee,
  Employee,
  Attendance,
  BatchStatus,
} from "../models/index.js";
import { asyncHandler } from "../middleware/errorHandler.js";
import { NotFoundError, ValidationError } from "../utils/errors.js";
import { logUserAction } from "../utils/logger.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

/**
 * Get all batches with filters
 * GET /api/batches
 */
export const getAllBatches = asyncHandler(
  async (req: Request, res: Response) => {
    const { trainingId, status, startDate, endDate } = req.query;

    const where: any = {};
    if (trainingId) where.trainingId = trainingId;
    if (status) where.status = status;
    if (startDate) where.startDate = { [Op.gte]: startDate };
    if (endDate) where.endDate = { [Op.lte]: endDate };

    const batches = await Batch.findAll({
      where,
      include: [
        {
          model: Training,
          as: "training",
          attributes: ["id", "name", "code", "durationDays"],
        },
      ],
      order: [["startDate", "DESC"]],
    });

    // Get enrollment counts
    const batchIds = batches.map((b) => b.id);
    const enrollmentCounts = (await BatchEmployee.findAll({
      where: { batchId: { [Op.in]: batchIds } },
      attributes: [
        "batchId",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["batchId"],
      raw: true,
    })) as any[];

    const countsMap = enrollmentCounts.reduce((acc: any, row: any) => {
      acc[row.batchId] = parseInt(row.count);
      return acc;
    }, {});

    const batchesWithCounts = batches.map((batch) => ({
      ...batch.toJSON(),
      enrolledCount: countsMap[batch.id] || 0,
    }));

    res.json({
      success: true,
      data: { batches: batchesWithCounts },
    });
  },
);

/**
 * Get batch by ID
 * GET /api/batches/:id
 */
export const getBatchById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const batch = await Batch.findByPk(id, {
      include: [
        { model: Training, as: "training" },
        {
          model: Employee,
          as: "employees",
          through: { attributes: ["enrollmentStatus", "enrolledAt"] },
        },
      ],
    });

    if (!batch) {
      throw new NotFoundError("Batch");
    }

    res.json({
      success: true,
      data: { batch },
    });
  },
);

/**
 * Create batch
 * POST /api/batches
 */
export const createBatch = asyncHandler(async (req: Request, res: Response) => {
  const {
    trainingId,
    startDate,
    endDate,
    capacity,
    venue,
    instructorName,
    notes,
  } = req.body;

  // Validate training
  const training = await Training.findByPk(trainingId);
  if (!training) {
    throw new NotFoundError("Training");
  }

  // Validate dates
  if (new Date(endDate) < new Date(startDate)) {
    throw new ValidationError("End date must be after or equal to start date");
  }

  const batch = await Batch.create({
    trainingId,
    startDate,
    endDate,
    capacity: Number(capacity),
    venue,
    instructorName,
    notes: notes || null,
    status: BatchStatus.SCHEDULED,
  });

  logUserAction(req.user!.id, "create", "batches", batch.id);

  res.status(201).json({
    success: true,
    data: { batch },
  });
});

/**
 * Update batch
 * PUT /api/batches/:id
 */
export const updateBatch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { startDate, endDate, capacity, venue, instructorName, status, notes } =
    req.body;

  const batch = await Batch.findByPk(id);
  if (!batch) {
    throw new NotFoundError("Batch");
  }

  // Validate dates if changing
  const newStartDate = startDate || batch.startDate;
  const newEndDate = endDate || batch.endDate;
  if (new Date(newEndDate) < new Date(newStartDate)) {
    throw new ValidationError("End date must be after or equal to start date");
  }

  await batch.update({
    startDate: startDate || batch.startDate,
    endDate: endDate || batch.endDate,
    capacity: capacity !== undefined ? Number(capacity) : batch.capacity,
    venue: venue || batch.venue,
    instructorName: instructorName || batch.instructorName,
    status: status || batch.status,
    notes: notes !== undefined ? notes : batch.notes,
  });

  logUserAction(req.user!.id, "update", "batches", batch.id);

  res.json({
    success: true,
    data: { batch },
  });
});

/**
 * Delete batch
 * DELETE /api/batches/:id
 */
export const deleteBatch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const batch = await Batch.findByPk(id);
  if (!batch) {
    throw new NotFoundError("Batch");
  }

  // Check if batch has enrollments
  const enrollmentCount = await BatchEmployee.count({ where: { batchId: id } });
  if (enrollmentCount > 0) {
    throw new ValidationError(
      "Cannot delete batch with enrolled employees. Remove enrollments first.",
    );
  }

  await batch.destroy();

  logUserAction(req.user!.id, "delete", "batches", parseInt(id));

  res.json({
    success: true,
    message: "Batch deleted successfully",
  });
});

/**
 * Enroll employees in batch
 * POST /api/batches/:id/enroll
 */
export const enrollEmployees = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { employeeIds } = req.body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      throw new ValidationError("Employee IDs array is required");
    }

    const batch = await Batch.findByPk(id);
    if (!batch) {
      throw new NotFoundError("Batch");
    }

    // Check capacity
    const currentCount = await BatchEmployee.count({ where: { batchId: id } });
    if (currentCount + employeeIds.length > batch.capacity) {
      throw new ValidationError(
        `Cannot enroll ${employeeIds.length} employees. Batch capacity is ${batch.capacity}, current enrollment is ${currentCount}`,
      );
    }

    // Check for existing enrollments
    const existingEnrollments = await BatchEmployee.findAll({
      where: { batchId: id, employeeId: { [Op.in]: employeeIds } },
    });

    const alreadyEnrolled = existingEnrollments.map((e) => e.employeeId);
    const newEnrollments = employeeIds.filter(
      (empId: number) => !alreadyEnrolled.includes(empId),
    );

    // Enroll new employees
    const enrollments = await BatchEmployee.bulkCreate(
      newEnrollments.map((employeeId: number) => ({
        batchId: batch.id,
        employeeId,
        enrolledBy: req.user!.id,
      })),
    );

    logUserAction(req.user!.id, "enroll", "batches", batch.id, {
      employeeIds: newEnrollments,
    });

    res.status(201).json({
      success: true,
      data: {
        enrolled: enrollments.length,
        skipped: alreadyEnrolled.length,
      },
    });
  },
);

/**
 * Remove employee from batch
 * DELETE /api/batches/:id/enroll/:employeeId
 */
export const removeEmployee = asyncHandler(
  async (req: Request, res: Response) => {
    const { id, employeeId } = req.params;

    const enrollment = await BatchEmployee.findOne({
      where: { batchId: id, employeeId },
    });

    if (!enrollment) {
      throw new NotFoundError("Enrollment");
    }

    await enrollment.destroy();

    logUserAction(req.user!.id, "unenroll", "batches", parseInt(id), {
      employeeId: parseInt(employeeId),
    });

    res.json({
      success: true,
      message: "Employee removed from batch",
    });
  },
);

/**
 * Get batch attendance
 * GET /api/batches/:id/attendance
 */
export const getBatchAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const batch = await Batch.findByPk(id, {
      include: [{ model: Training, as: "training" }],
    });

    if (!batch) {
      throw new NotFoundError("Batch");
    }

    // Get enrolled employees
    const enrollments = await BatchEmployee.findAll({
      where: { batchId: id },
      include: [{ model: Employee, as: "employee" }],
    });

    // Get attendance records
    const attendance = await Attendance.findAll({
      where: { batchId: id },
    });

    // Build attendance matrix
    const durationDays = (batch as any).training.durationDays;
    const attendanceMatrix = enrollments.map((enrollment) => {
      const empAttendance = attendance.filter(
        (a) => a.employeeId === enrollment.employeeId,
      );
      const days: { day: number; isPresent: boolean; markedAt: Date | null }[] =
        [];

      for (let day = 1; day <= durationDays; day++) {
        const record = empAttendance.find((a) => a.dayNumber === day);
        days.push({
          day,
          isPresent: record?.isPresent || false,
          markedAt: record?.markedAt || null,
        });
      }

      return {
        employee: (enrollment as any).employee,
        days,
        totalPresent: empAttendance.filter((a) => a.isPresent).length,
        isComplete:
          empAttendance.filter((a) => a.isPresent).length === durationDays,
      };
    });

    res.json({
      success: true,
      data: {
        batch,
        durationDays,
        attendance: attendanceMatrix,
      },
    });
  },
);

/**
 * Mark attendance
 * POST /api/batches/:id/attendance
 */
export const markAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { employeeId, dayNumber, isPresent } = req.body;

    const batch = await Batch.findByPk(id, {
      include: [{ model: Training, as: "training" }],
    });

    if (!batch) {
      throw new NotFoundError("Batch");
    }

    // Validate day number
    const durationDays = (batch as any).training.durationDays;
    if (dayNumber < 1 || dayNumber > durationDays) {
      throw new ValidationError(
        `Day number must be between 1 and ${durationDays}`,
      );
    }

    // Check if employee is enrolled
    const enrollment = await BatchEmployee.findOne({
      where: { batchId: id, employeeId },
    });

    if (!enrollment) {
      throw new NotFoundError("Enrollment");
    }

    // Upsert attendance
    const [attendance, created] = await Attendance.findOrCreate({
      where: { batchId: id, employeeId, dayNumber },
      defaults: {
        batchId: parseInt(id),
        employeeId,
        dayNumber,
        isPresent,
        markedAt: new Date(),
        markedBy: req.user!.id,
      },
    });

    if (!created) {
      await attendance.update({
        isPresent,
        markedAt: new Date(),
        markedBy: req.user!.id,
      });
    }

    logUserAction(req.user!.id, "mark_attendance", "batches", parseInt(id), {
      employeeId,
      dayNumber,
      isPresent,
    });

    res.json({
      success: true,
      data: { attendance },
    });
  },
);

/**
 * Bulk mark attendance
 * POST /api/batches/:id/attendance/bulk
 */
export const bulkMarkAttendance = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { dayNumber, records } = req.body;

    // records: [{ employeeId: number, isPresent: boolean }]

    if (!Array.isArray(records)) {
      throw new ValidationError("Records array is required");
    }

    const batch = await Batch.findByPk(id, {
      include: [{ model: Training, as: "training" }],
    });

    if (!batch) {
      throw new NotFoundError("Batch");
    }

    const durationDays = (batch as any).training.durationDays;
    if (dayNumber < 1 || dayNumber > durationDays) {
      throw new ValidationError(
        `Day number must be between 1 and ${durationDays}`,
      );
    }

    const results = await Promise.all(
      records.map(
        async (record: { employeeId: number; isPresent: boolean }) => {
          const [attendance, _created] = await Attendance.findOrCreate({
            where: { batchId: id, employeeId: record.employeeId, dayNumber },
            defaults: {
              batchId: parseInt(id),
              employeeId: record.employeeId,
              dayNumber,
              isPresent: record.isPresent,
              markedAt: new Date(),
              markedBy: req.user!.id,
            },
          });

          await attendance.update({
            isPresent: record.isPresent,
            markedAt: new Date(),
            markedBy: req.user!.id,
          });

          return attendance;
        },
      ),
    );

    logUserAction(
      req.user!.id,
      "bulk_mark_attendance",
      "batches",
      parseInt(id),
      { dayNumber, count: records.length },
    );

    res.json({
      success: true,
      data: { updated: results.length },
    });
  },
);

/**
 * Clone batch
 * POST /api/batches/:id/clone
 */
export const cloneBatch = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { startDate, endDate, venue, instructorName } = req.body;

  const originalBatch = await Batch.findByPk(id, {
    include: [{ model: Training, as: "training" }],
  });

  if (!originalBatch) {
    throw new NotFoundError("Batch");
  }

  // Validate dates if provided
  if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
    throw new ValidationError("End date must be after or equal to start date");
  }

  // Create new batch with same training
  const newBatch = await Batch.create({
    trainingId: originalBatch.trainingId,
    startDate: startDate || originalBatch.startDate,
    endDate: endDate || originalBatch.endDate,
    capacity: originalBatch.capacity,
    venue: venue || originalBatch.venue,
    instructorName: instructorName || originalBatch.instructorName,
    notes: `Cloned from batch #${originalBatch.id}`,
    status: BatchStatus.SCHEDULED,
  });

  logUserAction(req.user!.id, "clone", "batches", newBatch.id, {
    clonedFrom: originalBatch.id,
  });

  res.status(201).json({
    success: true,
    data: { batch: newBatch },
  });
});

export default {
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  enrollEmployees,
  removeEmployee,
  getBatchAttendance,
  markAttendance,
  bulkMarkAttendance,
  cloneBatch,
};
