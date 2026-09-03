import bcrypt from "bcryptjs";
import jwt, { SignOptions } from "jsonwebtoken";
import { env } from "../../config/env";
import { healthWorkersRepository } from "../health-workers/health-workers.repository";
import { UnauthorizedError, ConflictError } from "../../utils/errors";
import { LoginInput, RegisterHealthWorkerInput } from "./auth.validation";
import { HealthWorker } from "../../types/domain";

function signToken(worker: Pick<HealthWorker, "id" | "email" | "role">): string {
  const options: SignOptions = { expiresIn: env.JWT_EXPIRES_IN as SignOptions["expiresIn"] };
  return jwt.sign({ sub: worker.id, email: worker.email, role: worker.role }, env.JWT_SECRET, options);
}

function toPublicWorker(worker: HealthWorker) {
  const { password_hash: _password_hash, ...publicFields } = worker;
  return publicFields;
}

export const authService = {
  async login(input: LoginInput) {
    const worker = await healthWorkersRepository.findByEmail(input.email);
    if (!worker || !worker.is_active) {
      throw new UnauthorizedError("Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(input.password, worker.password_hash);
    if (!passwordMatches) {
      throw new UnauthorizedError("Invalid email or password");
    }

    await healthWorkersRepository.touchLastLogin(worker.id);

    return {
      token: signToken(worker),
      worker: toPublicWorker(worker),
    };
  },

  async register(input: RegisterHealthWorkerInput) {
    const existing = await healthWorkersRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError("A health worker with this email already exists");
    }

    const passwordHash = await bcrypt.hash(input.password, 10);
    const worker = await healthWorkersRepository.create({
      full_name: input.fullName,
      email: input.email.toLowerCase(),
      password_hash: passwordHash,
      role: input.role,
      language: input.language,
      district: input.district ?? null,
    });

    return {
      token: signToken(worker),
      worker: toPublicWorker(worker),
    };
  },
};
