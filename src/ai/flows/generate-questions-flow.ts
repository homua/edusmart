
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
// AI Question Types for Generation
const AIQuestionTypeEnum = z.enum([
  'TEXT',           // Tự luận (dài)
  'MCQ_4',          // Trắc nghiệm 4 đáp án
  'TRUE_FALSE',     // Trắc nghiệm Đúng/Sai
  'SHORT_ANSWER',   // Trắc nghiệm trả lời ngắn (tự điền từ)
  'ALL_MCQ'         // Tổng hợp tất cả các dạng trắc nghiệm trên
]);

const GenerateQuestionsInputSchema = z.object({
  title: z.string().describe('The title of the assignment, which provides context for the questions.'),
  subject: z.string().describe('The subject of the questions to generate.'),
  difficulty: DifficultyEnum.describe('The difficulty level of the questions.'),
  questionType: AIQuestionTypeEnum.describe('The specific format of questions to generate.'),
  count: z.number().min(1).max(10).describe('The number of questions to generate.'),
});
export type GenerateQuestionsInput = z.infer<typeof GenerateQuestionsInputSchema>;

const QuestionSchema = z.object({
    id: z.string().describe("A unique identifier for the question"),
    text: z.string().describe("The text content of the question."),
    type: z.enum(['MULTIPLE_CHOICE', 'TEXT']).describe("The application type: MULTIPLE_CHOICE for objective, TEXT for subjective."),
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
  prompt: `Bạn là một trợ lý chuyên gia thiết kế chương trình giảng dạy của Việt Nam.
Nhiệm vụ: Tạo ra chính xác {{count}} câu hỏi cho bài tập "{{title}}" thuộc môn {{subject}} với độ khó {{difficulty}}.

Yêu cầu cụ thể về dạng câu hỏi ({{questionType}}):
1. Nếu là 'TEXT': Tạo câu hỏi Tự luận dài, yêu cầu học sinh phân tích hoặc giải thích. (type: 'TEXT', không cần options)
2. Nếu là 'MCQ_4': Tạo câu hỏi Trắc nghiệm có 4 lựa chọn A, B, C, D. (type: 'MULTIPLE_CHOICE', options phải có 4 lựa chọn)
3. Nếu là 'TRUE_FALSE': Tạo câu hỏi Trắc nghiệm Đúng/Sai. (type: 'MULTIPLE_CHOICE', options: ['Đúng', 'Sai'])
4. Nếu là 'SHORT_ANSWER': Tạo câu hỏi yêu cầu trả lời ngắn gọn (1-2 từ hoặc 1 cụm từ). (type: 'TEXT', không cần options)
5. Nếu là 'ALL_MCQ': Hãy tạo một mảng hỗn hợp bao gồm cả Trắc nghiệm 4 đáp án, Đúng/Sai và Trả lời ngắn.

Quy tắc:
- Mức điểm phù hợp: 0.25, 0.5, 1, 2, 3, 4, 5 dựa trên độ khó của từng câu.
- Ngôn ngữ: Tiếng Việt chuẩn, văn phong sư phạm.
- ID: 'q_' + một chuỗi ngẫu nhiên.
- Luôn trả về dữ liệu dưới dạng mảng JSON các đối tượng câu hỏi theo đúng cấu trúc schema yêu cầu.`,
});

const generateQuestionsFlow = ai.defineFlow(
  {
    name: 'generateQuestionsFlow',
    inputSchema: GenerateQuestionsInputSchema,
    outputSchema: GenerateQuestionsOutputSchema,
  },
  async input => {
    const {output} = await generateQuestionsPrompt(input);
    if (!output) {
      throw new Error("AI không tạo được câu hỏi. Hãy thử lại với tiêu đề hoặc môn học rõ ràng hơn.");
    }
    // Đảm bảo ID luôn duy nhất bằng cách thêm timestamp vào kết quả AI
    return output.map(q => ({
      ...q, 
      id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}` 
    }));
  }
);
