"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type UpdateClientState = {
  error: string | null;
  success: boolean;
};

function readField(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

export async function createClient(
  _previousState: UpdateClientState,
  formData: FormData
): Promise<UpdateClientState> {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const name = readField(formData, "name");

  if (name.length < 2 || name.length > 160) {
    return {
      error: "Client name must be between 2 and 160 characters.",
      success: false,
    };
  }

  const billingEmail = readField(formData, "billingEmail");

  if (billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
    return { error: "Enter a valid billing email.", success: false };
  }

  /*
   * Optional: when created from a contact page, that contact
   * is attached to the new client straight away.
   */
  const contactId = readField(formData, "contactId");

  let clientId: string;

  try {
    const client = await prisma.client.create({
      data: {
        name,
        billingEmail: billingEmail || null,
        phone: readField(formData, "phone") || null,
        organizationNumber:
          readField(formData, "organizationNumber") || null,
        billingAddress: readField(formData, "billingAddress") || null,
        notes: readField(formData, "notes") || null,
        ...(contactId
          ? { contacts: { connect: { id: contactId } } }
          : {}),
      },
      select: { id: true },
    });

    clientId = client.id;
  } catch (error) {
    console.error("[HUB] Could not create client:", error);
    return { error: "Could not create the client.", success: false };
  }

  revalidatePath("/hub/clients");

  if (contactId) {
    revalidatePath(`/hub/contacts/${contactId}`);
  }

  redirect(`/hub/clients/${clientId}`);
}

export async function updateClient(
  _previousState: UpdateClientState,
  formData: FormData
): Promise<UpdateClientState> {
  const session = await getSession();

  if (!session || session.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }

  const clientId = readField(formData, "clientId");
  const name = readField(formData, "name");

  if (!clientId) {
    return { error: "Missing client.", success: false };
  }

  if (name.length < 2 || name.length > 160) {
    return {
      error: "Client name must be between 2 and 160 characters.",
      success: false,
    };
  }

  const billingEmail = readField(formData, "billingEmail");

  if (billingEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(billingEmail)) {
    return { error: "Enter a valid billing email.", success: false };
  }

  try {
    await prisma.client.update({
      where: { id: clientId },
      data: {
        name,
        billingEmail: billingEmail || null,
        phone: readField(formData, "phone") || null,
        organizationNumber:
          readField(formData, "organizationNumber") || null,
        billingAddress: readField(formData, "billingAddress") || null,
        notes: readField(formData, "notes") || null,
      },
    });
  } catch (error) {
    console.error("[HUB] Could not update client:", error);
    return { error: "Could not save the client.", success: false };
  }

  revalidatePath("/hub/clients");
  revalidatePath(`/hub/clients/${clientId}`);

  return { error: null, success: true };
}
