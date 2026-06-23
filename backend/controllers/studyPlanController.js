const db = require('../config/db');
const nodemailer = require('nodemailer');
const { awardXP } = require('../utils/gamification');

const replanTasks = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Get all incomplete tasks from the past
    const missedTasksResult = await db.query(
      'SELECT * FROM study_plan WHERE user_id = $1 AND status = false AND deleted = false AND date < CURRENT_DATE ORDER BY date ASC',
      [user_id]
    );

    const missedTasks = missedTasksResult.rows;

    if (missedTasks.length === 0) {
      return res.status(200).json({ message: 'No missed tasks to replan. Great job keeping up!' });
    }

    // Find the latest task date the user currently has scheduled
    const maxDateResult = await db.query(
      'SELECT MAX(date) as max_date FROM study_plan WHERE user_id = $1',
      [user_id]
    );

    let nextAvailableDate = maxDateResult.rows[0].max_date ? new Date(maxDateResult.rows[0].max_date) : new Date();
    
    // Start scheduling from the day after the latest task
    nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);

    // Shift missed tasks to the end of the schedule
    for (const task of missedTasks) {
      await db.query(
        'UPDATE study_plan SET date = $1 WHERE id = $2',
        [nextAvailableDate.toISOString().split('T')[0], task.id]
      );
      nextAvailableDate.setDate(nextAvailableDate.getDate() + 1);
    }

    res.status(200).json({ message: `Successfully replanned ${missedTasks.length} missed tasks!` });
  } catch (error) {
    console.error('Error auto-replanning:', error);
    res.status(500).json({ error: 'Failed to replan study schedule' });
  }
};

const sendReminderEmail = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // In a real app, fetch user email. Using a dummy for MVP.
    const userResult = await db.query('SELECT name, email FROM users WHERE id = $1', [user_id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];

    const tasksResult = await db.query(
      'SELECT task FROM study_plan WHERE user_id = $1 AND date = CURRENT_DATE AND status = false AND deleted = false',
      [user_id]
    );
    
    const tasks = tasksResult.rows.map(row => row.task);
    
    if (tasks.length === 0) {
      return res.status(200).json({ message: 'No tasks for today. No email sent.' });
    }

    // Setup NodeMailer Transporter (mock credentials for MVP)
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email", // Fake SMTP service for testing
      port: 587,
      secure: false, 
      auth: {
        user: 'dummy@ethereal.email',
        pass: 'dummy_password'
      },
    });

    const info = await transporter.sendMail({
      from: '"StudyPilot AI" <no-reply@studypilot.ai>',
      to: user.email,
      subject: "Your Daily Study Tasks 🚀",
      html: `
        <h2>Hello ${user.name}!</h2>
        <p>Here are your tasks for today. Let's crush them!</p>
        <ul>
          ${tasks.map(t => `<li>${t}</li>`).join('')}
        </ul>
        <p>Happy Studying,</p>
        <p>Your StudyPilot AI</p>
      `,
    });

    console.log("Message sent: %s", info.messageId);
    res.status(200).json({ message: 'Reminder email sent successfully via Ethereal SMTP' });
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send reminder email' });
  }
};

const getTasks = async (req, res) => {
  try {
    const user_id = req.user.id;
    const tasksResult = await db.query(
      'SELECT id, task, status, date FROM study_plan WHERE user_id = $1 AND deleted = false AND date <= CURRENT_DATE ORDER BY date DESC',
      [user_id]
    );
    res.status(200).json({ tasks: tasksResult.rows });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

const toggleTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    
    // Toggle status safely by checking ownership
    const taskResult = await db.query('SELECT status FROM study_plan WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const currentStatus = taskResult.rows[0].status;
    
    const newStatus = currentStatus ? false : true; 
    
    await db.query('UPDATE study_plan SET status = $1 WHERE id = $2', [newStatus, id]);
    
    let xpData = null;
    if (newStatus === true) {
      // Award 20 XP for completing a task!
      xpData = await awardXP(user_id, 20);
    }
    
    res.status(200).json({ message: 'Task toggled', status: newStatus, xpData });
  } catch (error) {
    console.error('Error toggling task:', error);
    res.status(500).json({ error: 'Failed to toggle task' });
  }
};

const getStats = async (req, res) => {
  try {
    const user_id = req.user.id;
    
    // Get user XP and Level
    const userResult = await db.query('SELECT xp, level FROM users WHERE id = $1', [user_id]);
    const { xp, level } = userResult.rows[0];
    
    // Get max date for Upcoming Exam
    const maxDateResult = await db.query('SELECT MAX(date) as max_date FROM study_plan WHERE user_id = $1', [user_id]);
    const maxDate = maxDateResult.rows[0].max_date;
    
    // Calculate Streak and Submissions
    const activeDaysResult = await db.query(
      'SELECT date, COUNT(*) as count FROM study_plan WHERE user_id = $1 AND status = true GROUP BY date ORDER BY date DESC',
      [user_id]
    );
    
    const completedDatesData = activeDaysResult.rows;
    const completedDates = completedDatesData.map(r => {
      if (r.date instanceof Date) {
        return r.date.toISOString().split('T')[0];
      }
      return r.date;
    });
    
    // Map to dictionary for easy lookup
    const submissionDict = {};
    let totalTasksYear = 0;
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const oneYearAgoStr = oneYearAgo.toISOString().split('T')[0];

    completedDatesData.forEach((r, i) => {
      const dStr = completedDates[i];
      submissionDict[dStr] = parseInt(r.count, 10);
      if (dStr >= oneYearAgoStr) {
        totalTasksYear += parseInt(r.count, 10);
      }
    });

    let currentStreak = 0;
    const todayStr = new Date().toISOString().split('T')[0];
    let checkDate = new Date();
    
    // Basic current streak calculation
    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (completedDates.includes(dateStr)) {
        currentStreak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        if (dateStr === todayStr && currentStreak === 0) {
          // If today is missed, check yesterday
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Max Streak Calculation
    let maxStreak = 0;
    let tempStreak = 0;
    // We need to sort dates ascending to calculate max streak easily
    const sortedDates = [...completedDates].sort();
    
    if (sortedDates.length > 0) {
      tempStreak = 1;
      maxStreak = 1;
      let prevDate = new Date(sortedDates[0]);
      
      for (let i = 1; i < sortedDates.length; i++) {
        const currDate = new Date(sortedDates[i]);
        const diffTime = Math.abs(currDate.getTime() - prevDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          tempStreak++;
          if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
        prevDate = currDate;
      }
    }

    // Build exactly 365 days of submissions
    const submissions = [];
    const buildDate = new Date(oneYearAgo);
    buildDate.setDate(buildDate.getDate() + 1); // Start from 364 days ago + today = 365 days
    
    const today = new Date();
    while (buildDate <= today) {
      const dStr = buildDate.toISOString().split('T')[0];
      submissions.push({
        date: dStr,
        count: submissionDict[dStr] || 0
      });
      buildDate.setDate(buildDate.getDate() + 1);
    }

    // Get today's actual progress including soft-deleted tasks
    const todayProgressResult = await db.query(
      "SELECT COUNT(*) as total, SUM(CASE WHEN status = true THEN 1 ELSE 0 END) as completed FROM study_plan WHERE user_id = $1 AND date = CURRENT_DATE",
      [user_id]
    );
    const todayTotalTasks = parseInt(todayProgressResult.rows[0].total || 0, 10);
    const todayCompletedTasks = parseInt(todayProgressResult.rows[0].completed || 0, 10);

    res.status(200).json({
      upcomingExam: maxDate ? new Date(maxDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null,
      studyStreak: currentStreak,
      maxStreak: maxStreak,
      totalActiveDays: completedDates.length,
      totalTasksYear: totalTasksYear,
      submissions: submissions,
      xp: xp || 0,
      level: level || 1,
      todayTotalTasks,
      todayCompletedTasks
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

const addCustomTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { task } = req.body;
    
    if (!task) {
      return res.status(400).json({ error: 'Task description is required' });
    }

    const date = new Date().toISOString().split('T')[0];
    
    // Using Postgres RETURNING id
    const result = await db.query(
      'INSERT INTO study_plan (user_id, date, task, status) VALUES ($1, $2, $3, false) RETURNING id',
      [user_id, date, task]
    );

    res.status(200).json({ 
      task: {
        id: result.rows[0].id, 
        task, 
        status: false, 
        date 
      }
    });
  } catch (error) {
    console.error('Error adding task:', error);
    res.status(500).json({ error: 'Failed to add custom task' });
  }
};

const deleteTask = async (req, res) => {
  try {
    const user_id = req.user.id;
    const { id } = req.params;
    
    const taskResult = await db.query('SELECT id FROM study_plan WHERE id = $1 AND user_id = $2', [id, user_id]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    await db.query('UPDATE study_plan SET deleted = true WHERE id = $1', [id]);
    res.status(200).json({ message: 'Task removed successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};

module.exports = {
  replanTasks,
  sendReminderEmail,
  getTasks,
  toggleTask,
  getStats,
  addCustomTask,
  deleteTask
};
