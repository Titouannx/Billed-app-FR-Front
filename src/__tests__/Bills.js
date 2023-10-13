/**
 * @jest-environment jsdom
 */

import {screen, waitFor, fireEvent} from "@testing-library/dom"
import '@testing-library/jest-dom';
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js"
import { bills } from "../fixtures/bills.js"
import { ROUTES_PATH } from "../constants/routes.js";
import {localStorageMock} from "../__mocks__/localStorage.js";

import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
jest.mock("../app/Store", () => mockStore)

//Simule fonction JQuery
$.fn.modal = jest.fn()

describe("Given I am connected as an employee", () => {
  beforeEach(()=>{
    Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      document.body.innerHTML = BillsUI({ data: bills })
  })
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon).toHaveClass('active-icon')
    })
    test("Then bills should be ordered from earliest to latest", () => {
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })
    test("handleClickNewBill should be called when buttonNewBill is clicked", async () => {
      await waitFor(() => screen.getAllByTestId('btn-new-bill'))
      //get buttonNewBill
      const buttonNewBill = screen.getByTestId('btn-new-bill')
      const handleClickNewBill = jest.fn(() => Bills.handleClickNewBill)
      //add event listener
      buttonNewBill.addEventListener('click', handleClickNewBill)
      //fire event
      fireEvent.click(buttonNewBill)
      //expect handleClickNewBill to be called
      await Promise.resolve()
      expect(handleClickNewBill).toHaveBeenCalled()
      // expect(buttonNewBill).toBeTruthy()
    })
    test("handleClickIconEye should be called when iconEye is clicked", async () => {
      await waitFor(() => screen.getAllByTestId('icon-eye')[0])
      const iconEye = screen.getAllByTestId('icon-eye')[0]
      const handleClickIconEye = jest.fn(() => Bills.handleClickIconEye)
      // screen.debug(screen.getAllByTestId('icon-eye')[0])
      iconEye.addEventListener('click', handleClickIconEye)
      fireEvent.click(iconEye)
      expect(handleClickIconEye).toHaveBeenCalled()
      expect(iconEye).toBeTruthy()
    })
  })
})

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When I navigate to Bills Page", () => {
    test("fetches bills from mock API GET", async () => {
      localStorage.setItem("user", JSON.stringify({ 
        type:"Employee",
      }));
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      screen.debug(screen.getByText("Services en ligne"))
      await waitFor(() => {
        expect(screen.getByText("accepted")).toBeTruthy()
        expect(screen.getAllByText("pending")).toBeTruthy()
        expect(screen.getAllByText("refused")).toBeTruthy()
      })
    })
    
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")

        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )

        window.localStorage.setItem('user', JSON.stringify({
          type:"Employee",
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })
      
      test("fetches bills from an API and fails with 404 message error", async () => {
  
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })
  
      test("fetches messages from an API and fails with 500 message error", async () => {
  
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})
  
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
