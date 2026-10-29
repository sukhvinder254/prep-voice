export interface Question {
  id: string;
  category: 'Behavioral' | 'Technical' | 'HR';
  question: string;
}

export const QUESTIONS: Question[] = [
  {
    id: '1',
    category: 'Behavioral',
    question: 'Tell me about yourself.',
  },
  {
    id: '2',
    category: 'Behavioral',
    question: 'Describe a challenging project you worked on and how you handled obstacles.',
  },
  {
    id: '3',
    category: 'Technical',
    question: 'Explain how REST APIs work and how they differ from GraphQL.',
  },
  {
    id: '4',
    category: 'Technical',
    question: 'What is state management in React, and when would you use Context API vs Redux?',
  },
  {
    id: '5',
    category: 'HR',
    question: 'What is your biggest strength and your biggest area of improvement?',
  },
];
