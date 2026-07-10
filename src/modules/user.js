/**
 * ==========================================================
 * User Module
 * ==========================================================
 */

import CONFIG from "./config.js";

class User {

    static getName() {

        let name = localStorage.getItem(CONFIG.USER_KEY);

        if (!name) {

            name = prompt("Enter your Name");

            if (!name) {

                name = "User";

            }

            localStorage.setItem(CONFIG.USER_KEY, name);

        }

        return name;

    }

    static changeName() {

        const current = this.getName();

        const name = prompt("Enter new Name", current);

        if (name) {

            localStorage.setItem(CONFIG.USER_KEY, name);

        }

    }

}

export default User;