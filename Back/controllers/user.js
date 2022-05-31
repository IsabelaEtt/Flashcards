let { User, Friendship, ObjectId } = require("../models");

module.exports = {
    getUserByLogin: async (username, password) => {
        if (!username) { throw new Error("Insira um nome de usuário"); }
        if (!password) { throw new Error("Insira uma senha"); }

        let user;
        try { user = await User.findOne({ username: username, password: password });
        } catch(e) { throw new Error(e.message); }

        if (!user) { throw new Error("Usuário ou senha inválidos"); }

        return user;
    },

    createNewUser: async (newUserData) => {
        if (!newUserData.username) { throw new Error("Insira um nome de usuário"); }
        if (!newUserData.password) { throw new Error("Insira uma senha"); }
        if (!newUserData.name) { throw new Error("Insira seu nome"); }

        let newUser;
        try { newUser = await User.create(newUserData);
        } catch(e) { throw new Error(e.message); }

        return newUser;
    }
}