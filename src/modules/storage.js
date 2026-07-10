/**
 * ==========================================================
 * WorkTracker Pro
 * Storage Module
 * ==========================================================
 */

import CONFIG from "./config.js";

class Storage {

    static load() {

        try {

            const data = localStorage.getItem(CONFIG.STORAGE_KEY);

            if (!data) return null;

            return JSON.parse(data);

        }

        catch (err) {

            console.error("Storage Load Error", err);

            return null;

        }

    }

    static save(data) {

        try {

            localStorage.setItem(

                CONFIG.STORAGE_KEY,

                JSON.stringify(data)

            );

            return true;

        }

        catch (err) {

            console.error("Storage Save Error", err);

            return false;

        }

    }

    static clear() {

        localStorage.removeItem(CONFIG.STORAGE_KEY);

    }

}

export default Storage;