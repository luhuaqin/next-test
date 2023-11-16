'use server';

import { signIn } from "@/auth";
import { sql } from "@vercel/postgres";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const FormScheme = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please Select a customer.'
  }),
  amount: z.coerce.number().gt(0, {message: 'Please enter an amount greater than $0'}),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please Select an invoice status.'
  }),
  date: z.string()
})

export type State = {
  errors?: {
    customerId: string[],
    amount?: string[],
    status?: string[]
  },
  message?: string | null;
}

const CreateInvoice = FormScheme.omit({ id: true, date: true })

export async function createInvoice(prevState: State, formData:FormData) {
  // const rawFormData = Object.fromEntries(formData.entries())
  // const rawFormData = {
  //   customerId: formData.get('customerId'),
  //   amount: formData.get('amount'),
  //   status: formData.get('status')
  // }
  // const { customerId, amount, status } = CreateInvoice.parse({
  //   customerId: formData.get('customerId'),
  //   amount: formData.get('amount'),
  //   status: formData.get('status')
  // })
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status')
  })

  if(!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }
  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // console.log(amountInCents, date, rawFormData)
  try{
    await sql`
      INSERT INTO invoices (customer_id, amount, status, date) VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
    `
  }catch(err) {
    return {
      message: 'Database Error: Failed to Create Invoice.'
    }
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')

  // console.log(rawFormData);
  // console.log(typeof rawFormData.amount)
}

export async function updateInvoice(id: string, prevState: State, formData:FormData) {
  // const { customerId, amount, status } = CreateInvoice.parse({
  //   customerId: formData.get('customerId'),
  //   amount: formData.get('amount'),
  //   status: formData.get('status')
  // })
  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status')
  })

  if(!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Edit Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;

  const amountInCents = amount * 100;

  try {
    await sql`
      UPDATE invoices
      SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
      WHERE id = ${id}
    `
  } catch (error) {
    return {
      message: 'Database Error: Failed to Edit Invoice.'
    }
  }

  revalidatePath('/dashboard/invoices')
  redirect('/dashboard/invoices')
}

export async function deleteInvoice(id: string) {
  // throw new Error('Failed to Delete Invoice.')
  try {
    await sql`
      DELETE FROM invoices
      WHERE id = ${id}
    `
    revalidatePath('/dashboard/invoices')
    return {
      message: 'Success to Delete Invoice.'
    }
  } catch (error) {
    return {
      message: 'Database Error: Failed to Delete Invoice.'
    }
  }
}

export async function authenticate(prevState:string|undefined, formData: FormData) {
    try {
      await signIn('credentials', Object.fromEntries(formData))
    } catch (error) {
      if ((error as Error).message.includes('CredentialsSignin')) {
        return 'CredentialSignin';
      }
      throw error;
    }
}
