import { NextFunction, Request, Response } from "express";
import twitter from "../lib/twitter";

export const getTwitterUserData = async (request: Request, response: Response, next: NextFunction) => {
    const code = request.query.code as string;
    const url = request.query.url as string;
    const userProvider = await twitter(code, url);
    response.status(200).json(userProvider);
}