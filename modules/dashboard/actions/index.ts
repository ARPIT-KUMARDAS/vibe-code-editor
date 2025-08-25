"use server"

import { db } from "@/lib/db";
import { currentUser } from "@/modules/auth/actions";

export const getAllPlaygroudForUser = async () => {
    const user = await currentUser();

    try {
        const playgound = await db.playground.findMany({
            where: {
                userId: user?.id

            },
            include:{
                user:true,
            }

        });
        return playgound;
    } catch (error)
     {
        console.log(error);
    }
}