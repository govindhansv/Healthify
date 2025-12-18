const mongoose = require('mongoose');
require('dotenv').config({ path: '.env.local' });
const HealthQuestion = require('./models/healthQuestion');

const defaultQuestions = [
    // Body
    {
        category: 'Body',
        questionNumber: 1,
        questionText: 'What is your primary fitness goal?',
        options: ['Weight Loss', 'Muscle Gain', 'General Health', 'Endurance'],
        optionScores: [8, 10, 10, 9], // All are good goals, weights reflect baseline engagement
        order: 1
    },
    {
        category: 'Body',
        questionNumber: 2,
        questionText: 'How many days per week can you exercise?',
        options: ['1-2 days', '3-4 days', '5-6 days', 'Everyday'],
        optionScores: [3, 7, 10, 8], // 5-6 is ideal for most
        order: 2
    },
    {
        category: 'Body',
        questionNumber: 3,
        questionText: 'How would you describe your current physical activity level?',
        options: ['Sedentary (Office job, little exercise)', 'Lightly Active (Walking, light chores)', 'Moderately Active (Regular exercise 3-4x week)', 'Very Active (Intense exercise 5x+ week)'],
        optionScores: [2, 5, 8, 10],
        order: 3
    },
    {
        category: 'Body',
        questionNumber: 4,
        questionText: 'Do you experience consistent joint or muscle pain?',
        options: ['Never', 'Rarely', 'Occasionally', 'Frequently'],
        optionScores: [10, 8, 5, 2],
        order: 4
    },

    // Mind
    {
        category: 'Mind',
        questionNumber: 1,
        questionText: 'How would you rate your daily stress levels?',
        options: ['Low', 'Moderate', 'High', 'Very High'],
        optionScores: [10, 7, 4, 1],
        order: 1
    },
    {
        category: 'Mind',
        questionNumber: 2,
        questionText: 'Do you practice meditation or mindfulness?',
        options: ['Daily', 'Sometimes', 'Rarely', 'Never'],
        optionScores: [10, 7, 3, 0],
        order: 2
    },
    {
        category: 'Mind',
        questionNumber: 3,
        questionText: 'How is your focus and concentration during the day?',
        options: ['Very Sharp', 'Good', 'Easily Distracted', 'Fuzzy/Brain Fog'],
        optionScores: [10, 8, 5, 2],
        order: 3
    },
    {
        category: 'Mind',
        questionNumber: 4,
        questionText: 'How often do you feel overwhelmed by your responsibilities?',
        options: ['Never', 'Rarely', 'Occasionally', 'Almost Always'],
        optionScores: [10, 8, 5, 1],
        order: 4
    },

    // Nutrition
    {
        category: 'Nutrition',
        questionNumber: 1,
        questionText: 'How many meals do you eat per day?',
        options: ['2 meals', '3 meals', '4-5 meals', 'Irregular'],
        optionScores: [6, 10, 8, 3],
        order: 1
    },
    {
        category: 'Nutrition',
        questionNumber: 2,
        questionText: 'How many servings of fruits and vegetables do you consume daily?',
        options: ['0-1 servings', '2-3 servings', '4-5 servings', 'More than 5'],
        optionScores: [2, 6, 10, 10],
        order: 2
    },
    {
        category: 'Nutrition',
        questionNumber: 3,
        questionText: 'How would you rate your daily water intake?',
        options: ['Very Low (<1L)', 'Moderate (1-2L)', 'Good (2-3L)', 'Excellent (3L+)'],
        optionScores: [2, 6, 10, 10],
        order: 3
    },
    {
        category: 'Nutrition',
        questionNumber: 4,
        questionText: 'How often do you consume processed foods or sugary drinks?',
        options: ['Rarely/Never', '1-2 times a week', '3-5 times a week', 'Daily'],
        optionScores: [10, 8, 4, 1],
        order: 4
    },

    // Lifestyle
    {
        category: 'Lifestyle',
        questionNumber: 1,
        questionText: 'How many hours of sleep do you get?',
        options: ['Less than 5', '5-6 hours', '7-8 hours', 'More than 8'],
        optionScores: [1, 5, 10, 8], // 7-8 is gold standard
        order: 1
    },
    {
        category: 'Lifestyle',
        questionNumber: 2,
        questionText: 'How would you rate your work-life balance?',
        options: ['Excellent', 'Good', 'Fair', 'Poor'],
        optionScores: [10, 8, 5, 2],
        order: 2
    },
    {
        category: 'Lifestyle',
        questionNumber: 3,
        questionText: 'Do you spend time outdoors or in nature regularly?',
        options: ['Daily', 'Weekly', 'Monthly', 'Rarely'],
        optionScores: [10, 8, 4, 1],
        order: 3
    },
    {
        category: 'Lifestyle',
        questionNumber: 4,
        questionText: 'How often do you disconnect from digital devices?',
        options: ['Daily deep work/breaks', 'Regularly', 'Seldom', 'Never'],
        optionScores: [10, 8, 4, 0],
        order: 4
    },
];

async function seed() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        await HealthQuestion.deleteMany({});
        console.log('Cleared existing questions');

        await HealthQuestion.insertMany(defaultQuestions);
        console.log(`Seeded ${defaultQuestions.length} questions`);

        process.exit(0);
    } catch (error) {
        console.error('Seed error:', error);
        process.exit(1);
    }
}

seed();
