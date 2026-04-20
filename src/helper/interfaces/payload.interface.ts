import { User } from "app/core/user/interface";

export interface UserPayload {
    exp: number;
    iat: number;
    user: User
}
