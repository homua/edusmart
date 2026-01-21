'use server';

/**
 * @fileOverview A flow to generate assignment questions using AI.
 *
 * - generateQuestionsAI - A function that generates questions based on subject, difficulty, and type.
 * - GenerateQuestionsInput - The input type for the generateQuestionsAI function.
 * - GenerateQuestionsOutput - The return type for the generateQuestionsAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DifficultyEnum = z.enum(['Dễ', 'Trung bình', 'Khó']);
const QuestionTypeEnum = z.enum(['MULTIPLE_CHOICE', 'TEXT']);

const GenerateQuestionsInputSchema = z.object({
  title: z.string().describe('The title of the assignment, which provides context for the questions.'),
  subject: z.string().describe('The subject of the questions to generate.'),
  difficulty: DifficultyEnum.describe('The difficulty level of the questions.'),
  questionType: QuestionTypeEnum.describe('The type of questions to generate.'),
  count: z.number().min(1).max(10).describe('The number of questions to generate.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const QuestionSchema = z.object({
    id: z.string().describe("A unique identifier for the question, e.g., 'q_1712345678'"),
    text: z.string().describe("The text content of the question."),
    type: QuestionTypeEnum.describe("The type of the question, either MULTIPLE_CHOICE or TEXT."),
    options: z.array(z.string()).optional().describe("An array of possible answers for multiple-choice questions."),
    correctAnswer: z.string().describe("The correct answer to the question."),
    points: z.number().describe("The number of points this question is worth.")
});

const GenerateQuestionsOutputSchema = z.array(QuestionSchema);
export type GenerateQuestionsOutput = z.infer<typeof GenerateQuestionsOutputSchema>;


export async function generateQuestionsAI(input: GenerateQuestionsInput): Promise<GenerateQuestionsOutput> {
  return generateQuestionsFlow(input);
}

const generateQuestionsPrompt = ai.definePrompt({
  name: 'generateQuestionsPrompt',
  input: {schema: GenerateQuestionsInputSchema},
  output: {schema: GenerateQuestionsOutputSchema},
  prompt: `Bạn là một trợ lý chuyên gia thiết kế chương trình giảng dạy, có nhiệm vụ tạo ra các câu hỏi cho bài tập.
Nội dung của bài tập xoay quanh tiêu đề: "{{title}}".
Hãy tạo {{count}} câu hỏi về chủ đề {{subject}} với độ khó {{difficulty}} liên quan đến tiêu đề trên.
Loại câu hỏi phải là: {{questionType}}.

- Nếu loại là 'MULTIPLE_CHOICE', hãy cung cấp 4 lựa chọn và chỉ định đáp án đúng. Các lựa chọn phải khác biệt và hợp lý.
- Nếu loại là 'TEXT', câu hỏi nên là dạng câu hỏi mở hoặc tự luận, và cung cấp một câu trả lời mẫu hoặc các điểm chính cần có trong câu trả lời đúng.
- Mỗi câu hỏi phải có ID duy nhất theo định dạng 'q_' + một chuỗi ngẫu nhiên.
- Mỗi câu hỏi mặc định có giá trị 10 điểm.

Chỉ trả về một mảng JSON chứa các đối tượng câu hỏi, không có bất kỳ văn bản giải thích nào khác.`,
});

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async input => {
    const {output} = await generateQuestionsPrompt(input);
    // Overwrite the AI-generated ID with a more robust one to prevent collisions and ensure format.
    return output!.map(q => ({...q, id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` }));
  }
);
