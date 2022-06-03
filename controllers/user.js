let { User, Friendship, ObjectId } = require("../models");

module.exports = {
    getUserByLogin: async (username, password) => {
        if (!username) { throw new Error("Insira um nome de usuário"); }
        if (!password) { throw new Error("Insira uma senha"); }

        let user;
        try { user = await User.findOne({ username: username, password: password, deleted: false });
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
    },

    createNewFriendship: async (requesterId, friendId) => {
        if (!requesterId) { throw new Error("Insira o usuário"); }
        if (!friendId) { throw new Error("Insira o amigo"); }

        let requester;
        try { requester = await User.findOne({ _id: requesterId, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!requester) { throw new Error("Usuário não encontrado"); }

        let friend;
        try { friend = await User.findOne({ _id: friendId, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!friend) { throw new Error("Amigo não encontrado"); }

        let newFriendship;
        try { newFriendship = await Friendship.create({ user: requester._id, friend: friend._id });
        } catch(e) { throw new Error(e.message); }

        return newFriendship;
    },

    deleteFriendship: async (friendshipId) => {
        if (!friendshipId) { throw new Error("Insira a amizade"); }

        let friendshipToDelete;
        try { friendshipToDelete = await Friendship.findOne({ _id: friendshipId, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!friendshipToDelete) { throw new Error("Amizade não encontrada"); }

        friendshipToDelete.deleted = true;

        try { await friendshipToDelete.save();
        } catch(e) { throw new Error(e.message); }
    },

    getUserFriends: async (requesterId, skip, limit) => {
        if (!requesterId) { throw new Error("Insira o usuário"); }

        let requester;
        try { requester = await User.findOne({ _id: requesterId, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!requester) { throw new Error("Usuário não encontrado"); }

        // skip = Number(skip);
        // skip = isNaN(skip) || skip < 0 ? 0 : skip;

        // limit = Number(limit);
        // limit = isNaN(limit) || limit < 0 ? 10 : limit;

        let friendshipQuery = {
            $or: [
                {
                    user: requester._id
                },
                {
                    friend: requester._id
                }
            ], 
            deleted: false
        }

        let friends;
        try { 
            friends = await Friendship.find(friendshipQuery)
                .populate({ path: "user friend", select: "name username", model: "User" })
                // .skip(skip)
                // .limit(limit)
                .lean()
        } catch(e) { throw new Error(e.message); }

        friends = friends.map(obj => {
            let friendObj = String(obj.user._id) == String(requester._id) ? obj.friend : obj.user;
            return {...friendObj, friendshipId: obj._id };
        })

        let totalFriends;
        try { totalFriends = await Friendship.countDocuments(friendshipQuery);
        } catch(e) { throw new Error(e.message); }

        return {
            totalFriends,
            friends
        }
    },

    getUserPossibleNewFriends: async(requesterId) => {
        if (!requesterId) { throw new Error("Insira o usuário"); }

        let requester;
        try { requester = await User.findOne({ _id: requesterId, deleted: false });
        } catch(e) { throw new Error(e.message); }

        if (!requester) { throw new Error("Usuário não encontrado"); }

        let friendshipQuery = {
            $or: [
                {
                    user: requester._id
                },
                {
                    friend: requester._id
                }
            ], 
            deleted: false
        }

        let friends;
        try { 
            friends = await Friendship.find(friendshipQuery).select("user friend").lean()
        } catch(e) { throw new Error(e.message); }

        friends = friends.map(obj => {
            let friendId = String(obj.user) == String(requester._id) ? obj.friend : obj.user;
            return friendId;
        })

        let possibleNewFriends;
        try { possibleNewFriends = await User.find({ _id: { $nin: friends.concat([requester._id])} }).select("_id name username").lean();
        } catch(e) { throw new Error(e.message); }

        return possibleNewFriends;
    }
}