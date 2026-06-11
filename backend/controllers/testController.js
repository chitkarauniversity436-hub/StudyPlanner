const db = require('../config/db');
const { OpenAI } = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const generateTest = async (req, res) => {
  try {
    const { subject_name, question_count = 5 } = req.body;
    const user_id = req.user.id;
    if (!subject_name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }

    const numQuestions = parseInt(question_count, 10) || 5;

    // Fetch syllabus topics for this subject to context-inform the AI
    const topicsResult = await db.query(
      'SELECT topic_name FROM syllabus JOIN subjects ON syllabus.subject_id = subjects.id WHERE subjects.user_id = $1 AND subjects.subject_name = $2',
      [user_id, subject_name]
    );
    const topics = topicsResult.rows.map(r => r.topic_name).join(', ');

    let generatedQuestions = [];

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key') {
      const prompt = `Generate a detailed mock test for the subject "${subject_name}".
${topics ? `The questions MUST strictly test knowledge on the following specific syllabus topics: ${topics}.` : ''}
Return exactly ${numQuestions} Multiple Choice Questions (MCQs).
Format the response as a JSON array of objects. Each object must have:
- "id": a number (1, 2, 3)
- "question": the question text
- "options": an array of 4 string options
- "correctAnswer": the exact string of the correct option.`;

      try {
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }],
          response_format: { type: "json_object" },
        });

        const responseJson = JSON.parse(aiResponse.choices[0].message.content);
        if (responseJson.questions && Array.isArray(responseJson.questions)) {
          generatedQuestions = responseJson.questions;
        } else if (Array.isArray(responseJson)) {
          generatedQuestions = responseJson;
        } else {
          // If the model returns it inside some other key
          const firstKey = Object.keys(responseJson)[0];
          generatedQuestions = responseJson[firstKey];
        }
      } catch (e) {
        console.error("OpenAI test generation failed or parse failed, falling back...", e.message);
      }
    }

    // Fallback Mock Data
    if (!generatedQuestions || generatedQuestions.length === 0) {
      const topicList = topics ? topics.split(',').map(t => t.trim()).filter(Boolean) : [];
      const getTopic = (index) => topicList.length > 0 ? topicList[index % topicList.length] : subject_name;

      const fallbackTemplates = [
        {
          q: (topic) => `Regarding the topic of "${topic}", which of the following best describes its primary application in real-world scenarios?`,
          opts: [`It is primarily used to optimize ${subject_name} workflows`, 'It has no practical application', 'It is only theoretical', 'None of the above'],
          ans: `It is primarily used to optimize ${subject_name} workflows`
        },
        {
          q: (topic) => `When analyzing "${topic}", what is the most critical factor to consider for accurate implementation?`,
          opts: ['Ignoring edge cases', 'Ensuring compatibility with core systems', 'Using deprecated methods', 'Skipping the planning phase'],
          ans: 'Ensuring compatibility with core systems'
        },
        {
          q: (topic) => `How does the mechanism behind "${topic}" directly interact with other elements of ${subject_name}?`,
          opts: ['It creates a bridge between data structures', 'It isolates itself completely', 'It causes system crashes', 'It is purely cosmetic'],
          ans: 'It creates a bridge between data structures'
        },
        {
          q: (topic) => `Identify the main limitation or drawback when utilizing "${topic}" in a complex environment.`,
          opts: ['It scales infinitely without resources', 'It requires significant computational overhead', 'It operates independently of memory', 'It solves all known problems instantly'],
          ans: 'It requires significant computational overhead'
        },
        {
          q: (topic) => `What is the expected outcome if the principles of "${topic}" are violated during the development lifecycle?`,
          opts: ['System stability increases', 'Data corruption and severe logic errors', 'Faster execution times', 'The compiler automatically fixes it'],
          ans: 'Data corruption and severe logic errors'
        }
      ];

      generatedQuestions = [];
      for (let i = 0; i < numQuestions; i++) {
        const template = fallbackTemplates[i % fallbackTemplates.length];
        generatedQuestions.push({
          id: i + 1,
          question: template.q(getTopic(i)),
          options: template.opts,
          correctAnswer: template.ans
        });
      }
    }

    res.status(200).json({ questions: generatedQuestions });
  } catch (error) {
    console.error('Error generating test:', error);
    res.status(500).json({ error: 'Failed to generate test' });
  }
};

const submitTest = async (req, res) => {
  try {
    const { subject_name, score } = req.body;
    const user_id = req.user.id;

    if (!subject_name || score === undefined) {
      return res.status(400).json({ error: 'Subject name and score are required' });
    }

    await db.query(
      'INSERT INTO mock_tests (user_id, subject_name, score) VALUES ($1, $2, $3)',
      [user_id, subject_name, score]
    );

    res.status(200).json({ message: 'Test submitted successfully' });
  } catch (error) {
    console.error('Error submitting test:', error);
    res.status(500).json({ error: 'Failed to submit test' });
  }
};

const getWeaknesses = async (req, res) => {
  try {
    const user_id = req.user.id;

    // Fetch scores from DB
    const scoresResult = await db.query('SELECT subject_name, score FROM mock_tests WHERE user_id = $1', [user_id]);
    const scores = scoresResult.rows;

    if (scores.length === 0) {
      return res.status(200).json({ 
        analysis: "You haven't taken any mock tests yet. Take some tests so I can analyze your weaknesses!" 
      });
    }

    let analysisText = "";

    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key') {
      const prompt = `You are an AI study coach. Analyze the following mock test scores for a student and provide a short, encouraging summary of their weak subjects and recommended actions.
Scores:
${scores.map(s => `${s.subject_name}: ${s.score}%`).join('\n')}

Format: Give a brief paragraph highlighting the weaknesses and then 2-3 bullet points of recommendations.`;

      try {
        const aiResponse = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [{ role: "user", content: prompt }]
        });

        analysisText = aiResponse.choices[0].message.content;
      } catch (e) {
        console.error("OpenAI weakness analysis failed, falling back...", e.message);
      }
    }
    
    if (!analysisText) {
      // Fallback
      analysisText = `Based on your recent tests, you have some areas to improve.\n\nRecommended Actions:\n- Review the core concepts of your lowest scoring subjects.\n- Dedicate 2 extra hours per week to those topics.\n- Take another mock test next week.`;
    }

    res.status(200).json({ analysis: analysisText, scores });
  } catch (error) {
    console.error('Error analyzing weaknesses:', error);
    res.status(500).json({ error: 'Failed to analyze weaknesses' });
  }
}

module.exports = {
  generateTest,
  submitTest,
  getWeaknesses
};
