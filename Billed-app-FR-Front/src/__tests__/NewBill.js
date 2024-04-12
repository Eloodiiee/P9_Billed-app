/**
 * @jest-environment jsdom
 */

import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import { screen, fireEvent } from "@testing-library/dom"
import { ROUTES, ROUTES_PATH } from "../constants/routes.js" /**/
import { localStorageMock } from "../__mocks__/localStorage.js"
import mockStore from "../__mocks__/store"
import userEvent from "@testing-library/user-event" /**/
import "@testing-library/jest-dom"

jest.mock("../app/store", () => mockStore)

///////////// Ce cas de test verifie que les utilisateurs employés peuvent envoyer une nouvelle Note de Frais /////////

describe("Given I am connected as an employee", () => {
    describe("When I am on NewBill Page", () => {
        test("Then complete form for newBill", async () => {
            const onNavigate = (pathname) => {
                document.body.innerHTML = ROUTES({ pathname })
            }
            Object.defineProperty(window, "localStorage", {
                value: localStorageMock,
            })
            window.localStorage.setItem(
                "user",
                JSON.stringify({
                    type: "Employee",
                })
            )
            const html = NewBillUI()
            document.body.innerHTML = html
            const newBillTest = new NewBill({
                document,
                onNavigate,
                store: null,
                localStorage: window.localStorage,
            })

            const NewBillForm = screen.getByTestId("form-new-bill")
            expect(NewBillForm).toBeTruthy()

            const handleSubmit = jest.fn((e) => newBillTest.handleSubmit(e))
            NewBillForm.addEventListener("submit", handleSubmit)
            fireEvent.submit(NewBillForm)
            expect(handleSubmit).toHaveBeenCalled()
        })
    })
    /*Ce cas de test vérifie la capacité d'un employé à télécharger une image pour une nouvelle note de frais.*/
    test("Then verify the picture of the bill", async () => {
        jest.spyOn(mockStore, "bills")

        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
        }
        Object.defineProperty(window, "localStorage", { value: localStorageMock })
        Object.defineProperty(window, "location", {
            value: { hash: ROUTES_PATH["NewBill"] },
        })
        window.localStorage.setItem(
            "user",
            JSON.stringify({
                type: "Employee",
            })
        )

        const html = NewBillUI()
        document.body.innerHTML = html

        const newBillInit = new NewBill({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
        })

        const file = new File(["image"], "image.png", { type: "image/png" })
        const handleChangeFile = jest.fn((e) => newBillInit.handleChangeFile(e))
        const formNewBill = screen.getByTestId("form-new-bill")
        const billFile = screen.getByTestId("file")

        billFile.addEventListener("change", handleChangeFile)
        userEvent.upload(billFile, file)

        expect(billFile.files[0].name).toBeDefined()
        expect(handleChangeFile).toBeCalled()

        const handleSubmit = jest.fn((e) => newBillInit.handleSubmit(e))
        formNewBill.addEventListener("submit", handleSubmit)
        fireEvent.submit(formNewBill)
        expect(handleSubmit).toHaveBeenCalled()
    })

    /*Ce cas de test vérifie que l'application gère correctement la soumission d'un type de fichier non supporté en tant qu'image de note de frais.*/
    test("Then verify the submission of an unsupported file type", async () => {
        const onNavigate = (pathname) => {
            document.body.innerHTML = ROUTES({ pathname })
        }

        Object.defineProperty(window, "localStorage", { value: localStorageMock })
        Object.defineProperty(window, "location", {
            value: { hash: ROUTES_PATH["NewBill"] },
        })

        window.localStorage.setItem(
            "user",
            JSON.stringify({
                type: "Employee",
            })
        )

        const html = NewBillUI()
        document.body.innerHTML = html

        const newBillInit = new NewBill({
            document,
            onNavigate,
            store: mockStore,
            localStorage: window.localStorage,
        })

        const file = new File(["unsupported"], "unsupported.txt", {
            type: "text/plain",
        })
        const handleChangeFile = jest.fn((e) => newBillInit.handleChangeFile(e))
        //const formNewBill = screen.getByTestId("form-new-bill")/*Déclarée mais jamais lue*/
        const billFile = screen.getByTestId("file")

        billFile.addEventListener("change", handleChangeFile)
        userEvent.upload(billFile, file)

        expect(handleChangeFile).toBeCalled()
        expect(billFile.validationMessage).toBe("Merci d'utiliser le bon format JPG, JPEG ou PNG")
    })
})
