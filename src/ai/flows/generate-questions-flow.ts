
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
    type: z.enum(['MULTIPLE_CHOICE', 'TEXT']).describe("The application type: MULTIPLE_CHOICE for objective/options based or short answers, TEXT for subjective/written essays."),
    options: z.array(z.string()).optional().describe("An array of possible answers. MUST be omitted or empty for type 'TEXT' or 'SHORT_ANSWER'."),
    correctAnswer: z.string().describe("The correct answer. For 'TEXT', provide a model answer."),
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
  prompt: `Bạn là một trợ lý chuyên gia thiết kế chương trình giảng duy của Việt Nam.
Nhiệm vụ: Tạo ra chính xác {{count}} câu hỏi cho bài tập "{{title}}" thuộc môn {{subject}} với độ khó {{difficulty}}.

QUY TẮC BẮT BUỘC về dạng câu hỏi (Dựa trên yêu cầu: {{questionType}}):

1. NẾU yêu cầu là 'TEXT' (Tự luận):
   - Bạn PHẢI đặt "type": "TEXT".
   - Bạn KHÔNG ĐƯỢC cung cấp trường "options" (hoặc để mảng rỗng).
   - "correctAnswer" phải là một đoạn văn mẫu trả lời chi tiết.

2. NẾU yêu cầu là 'MCQ_4' (Trắc nghiệm 4 đáp án):
   - Bạn PHẢI đặt "type": "MULTIPLE_CHOICE".
   - Trường "options" PHẢI có đúng 4 lựa chọn (A, B, C, D).

3. NẾU yêu cầu là 'TRUE_FALSE' (Đúng/Sai):
   - Bạn PHẢI đặt "type": "MULTIPLE_CHOICE".
   - Trường "options" PHẢI chỉ có 2 lựa chọn: ["Đúng", "Sai"].

4. NẾU yêu cầu là 'SHORT_ANSWER' (Trả lời ngắn):
   - Bạn PHẢI đặt "type": "MULTIPLE_CHOICE" (Vì đây là dạng trắc nghiệm khách quan).
   - Bạn PHẢI để trường "options" là mảng rỗng [].
   - "correctAnswer" là từ hoặc cụm từ ngắn gọn, chính xác duy nhất.

5. NẾU yêu cầu là 'ALL_MCQ' (Tổng hợp trắc nghiệm):
   - Tạo hỗn hợp các dạng MCQ_4, TRUE_FALSE, SHORT_ANSWER. 
   - KHÔNG tạo câu hỏi tự luận dài trong phần này.

Quy tắc chung:
- Mức điểm phù hợp: 0.25, 0.5, 1, 2, 3, 4, 5 dựa trên độ khó.
- Ngôn ngữ: Tiếng Việt chuẩn, văn phong sư phạm.
- ID: 'q_' + một chuỗi ngẫu nhiên.
- Luôn trả về dữ liệu dưới dạng mảng JSON.`,
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
    
    return output.map(q => {
      // Logic xác định loại câu hỏi cuối cùng
      let finalType = q.type;
      let finalOptions = q.options || [];

      if (input.questionType === 'TEXT') {
          finalType = 'TEXT';
          finalOptions = [];
      } else if (input.questionType === 'SHORT_ANSWER') {
          finalType = 'MULTIPLE_CHOICE';
          finalOptions = [];
      } else if (input.questionType !== 'ALL_MCQ' && input.questionType !== 'TEXT') {
          finalType = 'MULTIPLE_CHOICE';
      }

      return {
        ...q, 
        id: `q_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        type: finalType,
        options: finalOptions
      };
    });
  }
);
