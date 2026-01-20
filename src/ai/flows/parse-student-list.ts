// This file is machine-generated - edit at your own risk!

'use server';

/**
 * @fileOverview Parses a bulk list of student names from a single string input using AI.
 *
 * - parseStudentListAI - A function that parses student names from bulk input.
 * - ParseStudentListInput - The input type for the parseStudentListAI function.
 * - ParseStudentListOutput - The return type for the parseStudentListAI function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ParseStudentListInputSchema = z.object({
  bulkInput: z
    .string()
    .describe(
      'A string containing a list of student names, potentially with other extraneous text.'
    ),
});
export type ParseStudentListInput = z.infer<typeof ParseStudentListInputSchema>;

const ParseStudentListOutputSchema = z.array(z.string());
export type ParseStudentListOutput = z.infer<typeof ParseStudentListOutputSchema>;

export async function parseStudentListAI(bulkInput: string): Promise<ParseStudentListOutput> {
  return parseStudentListFlow({bulkInput});
}

const parseStudentListPrompt = ai.definePrompt({
  name: 'parseStudentListPrompt',
  input: {schema: ParseStudentListInputSchema},
  output: {schema: ParseStudentListOutputSchema},
  prompt: `You are a helpful assistant designed to extract a list of student names from a bulk input. The input may contain extraneous text, such as formatting characters, numbers, or other irrelevant information. You should only return a JSON array of strings, where each string is a student name.

Input:
{{bulkInput}}`,
});

const parseStudentListFlow = ai.defineFlow(
  {
    name: 'parseStudentListFlow',
    inputSchema: ParseStudentListInputSchema,
    outputSchema: ParseStudentListOutputSchema,
  },
  async input => {
    const {output} = await parseStudentListPrompt(input);
    return output!;
  }
);
