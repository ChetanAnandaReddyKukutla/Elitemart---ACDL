import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const usersFilePath = path.join(__dirname, "../data/local-users.json");

const readUsersFile = async () => {
  try {
    const fileContent = await fs.readFile(usersFilePath, "utf8");
    const parsedUsers = JSON.parse(fileContent);
    return Array.isArray(parsedUsers) ? parsedUsers : [];
  } catch (error) {
    if (error.code === "ENOENT") {
      return [];
    }

    throw error;
  }
};

const writeUsersFile = async (users) => {
  await fs.writeFile(usersFilePath, `${JSON.stringify(users, null, 2)}\n`);
};

const sanitizeUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role || "customer",
});

export const findLocalUserByEmail = async (email) => {
  const users = await readUsersFile();
  return users.find(
    (user) => user.email?.toLowerCase() === String(email).toLowerCase()
  );
};

export const findLocalUserById = async (id) => {
  const users = await readUsersFile();
  return users.find((user) => String(user._id) === String(id));
};

export const createLocalUser = async ({ name, email, password, role }) => {
  const users = await readUsersFile();
  const existingUser = users.find(
    (user) => user.email?.toLowerCase() === String(email).toLowerCase()
  );

  if (existingUser) {
    const error = new Error("User already exists");
    error.statusCode = 400;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    _id: randomUUID(),
    name,
    email,
    password: hashedPassword,
    role: role || "customer",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  users.push(user);
  await writeUsersFile(users);

  return user;
};

export const verifyLocalUserPassword = async (user, enteredPassword) =>
  bcrypt.compare(enteredPassword, user.password);

export const getSanitizedLocalUser = sanitizeUser;