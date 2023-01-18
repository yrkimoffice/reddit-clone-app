import {Request, Response, Router} from "express";
import User from "../entities/User";
import {isEmpty, validate} from "class-validator";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import cookie from "cookie";

const mapError = (errors: Object[]) => {
    return errors.reduce((prev: any, err: any) => {
        prev[err.property] = Object.entries(err.constraints)[0][1];
        return prev;
    }, {})
}

const register = async (req: Request, res: Response) => {
    const { email, username, password } = req.body;

    try {
        let errors: any = {};

        // 이메일과 유저이름이 이미 사용되고 있는지 확인
        const emailUser = await User.findOneBy({email});
        const usernameUser = await User.findOneBy({username});

        // 이미 있다면 errors 객체에 넣어줌
        if (emailUser) errors.email = "이미 해당 이메일 주소가 사용되었습니다.";
        if (usernameUser) errors.username = "이미 이 사용자 이름이 사용되었습니다.";

        // 에러가 있다면 response에 error 담아서 리턴
        if (Object.keys(errors).length > 0) {
            return res.status(400).json(errors);
        }

        const user = new User();
        user.email = email;
        user.username = username;
        user.password = password;

        // 엔티티에 정의된 조건으로 user 데이터 유효성 검증
        errors = await validate(user);

        if (errors.length > 0) return res.status(400).json(mapError(errors));

        // user table에 저장
        await user.save();
        return res.json(user);

    } catch (error) {
        console.log(error);
        return res.status(500).json({error});
    }
};


const login = async (req: Request, res: Response) => {
    const { username, password } = req.body;

    try {
        let errors: any = {};

        // 비어있는지 체크
        if (isEmpty(username)) errors.email = "사용자 이름은 비워둘 수 없습니다.";
        if (isEmpty(password)) errors.username = "비밀번호는 비워둘 수 없습니다.";

        // 에러가 있다면 response에 error 담아서 리턴
        if (Object.keys(errors).length > 0) {
            return res.status(400).json(errors);
        }

        // user find
        const user = await User.findOneBy({username});

        if (!user) return res.status(404).json({username: '사용자 이름이 등록되지 않았습니다.'});

        // 유저가 있다면 비밀번호 비교
        const passwordMatches = await bcrypt.compare(password, user.password);

        // 비밀번호 다르다면 에러
        if(!passwordMatches) {
            return res.status(401).json({password: '비밀번호가 잘못되었습니다.'});
        }

        // 비밀번호 맞으면 토큰 생성
        const token = jwt.sign({username}, process.env.JWT_TOKEN)

        // 쿠키 저장
        res.set("Set-Cookie", cookie.serialize("token", token, {
            httpOnly: true,
            maxAge: 60 * 60 * 24 * 7,
            path: "/"
        }));

        return res.json({user, token});

    } catch (error) {
        console.log(error);
        return res.status(500).json({error});
    }
};

const router = Router();
router.post("/register", register);
router.post("/login", login);

export default router;