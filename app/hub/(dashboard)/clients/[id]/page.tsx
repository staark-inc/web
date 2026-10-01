import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CalendarDays,
  CreditCard,
  FileText,
  FolderKanban,
  LifeBuoy,
  Mail,
  Plus,
  ServerCog,
  Target,
  UserRound,
} from "lucide-react";

import { prisma } from "@/lib/prisma";
import { formatAmount } from "@/lib/format";