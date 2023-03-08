import {Request, Response, Router} from "express";
import userMiddleware from "../middlewares/user";
import User from "../entities/User";
import Post from "../entities/Post";
import Comment from "../entities/Comment";

const getUserData = async (req: Request, res: Response) => {
    try {
        // 유저 정보 가져오기
        const user = await User.findOneOrFail({
            where: {username: req.params.username},
            select: ["username", "createdAt"],
        });

        // 유저가 쓴 포스트 정보 가져오기
        const posts = await Post.find({
            where: {username: user.username},
            relations: ["comments", "votes", "sub"],
        });

        // 유저가 쓴 댓글 정보 가져오기
        const comments = await Comment.find({
            where: {username: user.username},
            relations: ["post"],
        });

        if (res.locals.user) {
            const {user} = res.locals;
            posts.forEach((p) => p.setUserVote(user));
            comments.forEach((c) => c.setUserVote(user));
        }

        let userData: any[] = [];

        // spread operator를 이용하여 새로운 객체로 복사를 할 때 인스턴스 상태로 하면 @Expose를 이용한 getter는 들어가지 않는다. 그래서 객체 형식으로 바꾼 후 복사
        posts.forEach((p) => userData.push({type: "Post", ...p.toJSON()}));
        comments.forEach((c) => userData.push({type: "Comment", ...c.toJSON()}));

        // 최신 정보가 먼저 오게 순서 정렬
        userData.sort((a, b) => {
            if (b.createdAt > a.createdAt) return 1;
            if (b.createdAt < a.createdAt) return -1;
            return 0;
        });

        return res.json({user, userData});
    } catch (error) {
        console.log(error);
        return res.status(500).json({error: "문제가 발생했습니다."});
    }
};

const router = Router();
router.get("/:username", userMiddleware, getUserData);

export default router;
