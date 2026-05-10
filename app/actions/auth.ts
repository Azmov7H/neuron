"use server";

import { z } from "zod";

// setup Zod schema for validating signup form data
const signupSchema = z.object({
  fullName: z.string().min(3, { message: "Name must be at least 3 characters." }),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  path: z.string().min(1, { message: "Please select a learning path." }),
});

export async function signupUser(formData: unknown) {
  // validate incoming data against the schema
  const validatedData = signupSchema.safeParse(formData);

  if (!validatedData.success) {
    return { success: false, errors: validatedData.error.flatten().fieldErrors };
  }

  console.log("Creating user with data:", validatedData.data);

  // simulate server processing time (replace with actual user creation logic, e.g., database call) 
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return { success: true, message: "Account created successfully! Redirecting..." };
}