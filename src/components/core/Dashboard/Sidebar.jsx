import { useState } from "react"
import { VscSignOut } from "react-icons/vsc"
import { useDispatch, useSelector } from "react-redux"
import { useNavigate } from "react-router-dom"

import { sidebarLinks } from "../../../data/dashboard-links"
import { logout } from "../../../services/operations/authAPI"
import ConfirmationModal from "../../Common/ConfirmationModal"
import SidebarLink from "./SidebarLink"

export default function Sidebar() {
  const { user, loading: profileLoading } = useSelector(
    (state) => state.profile
  )
  const { loading: authLoading } = useSelector((state) => state.auth)
  const dispatch = useDispatch()
  const navigate = useNavigate()
  // to keep track of confirmation modal
  const [confirmationModal, setConfirmationModal] = useState(null)

  if (profileLoading || authLoading) {
    return (
      <div className="grid h-14 w-full items-center border-b-[1px] border-b-richblack-700 bg-richblack-800 md:h-[calc(100vh-3.5rem)] md:w-auto md:min-w-[220px] md:border-b-0 md:border-r-[1px] md:border-r-richblack-700">
        <div className="spinner"></div>
      </div>
    )
  }

  return (
    <>
      {/* Phones: horizontal scrollable bar on top. Desktop: left sidebar */}
      <div className="flex w-full flex-row overflow-x-auto border-b-[1px] border-b-richblack-700 bg-richblack-800 py-2 md:h-[calc(100vh-3.5rem)] md:w-auto md:min-w-[220px] md:flex-col md:overflow-x-visible md:border-b-0 md:border-r-[1px] md:border-r-richblack-700 md:py-10">
        <div className="flex flex-row md:flex-col">
          {sidebarLinks.map((link) => {
            if (link.type && user?.accountType !== link.type) return null
            return (
              <SidebarLink key={link.id} link={link} iconName={link.icon} />
            )
          })}
        </div>
        <div className="mx-auto mt-6 mb-6 hidden h-[1px] w-10/12 bg-richblack-700 md:block" />
        <div className="flex flex-row md:flex-col">
          <SidebarLink
            link={{ name: "Settings", path: "/dashboard/settings" }}
            iconName="VscSettingsGear"
          />
          <button
            onClick={() =>
              setConfirmationModal({
                text1: "Are you sure?",
                text2: "You will be logged out of your account.",
                btn1Text: "Logout",
                btn2Text: "Cancel",
                btn1Handler: () => dispatch(logout(navigate)),
                btn2Handler: () => setConfirmationModal(null),
              })
            }
            className="whitespace-nowrap px-4 py-2 text-sm font-medium text-richblack-300 md:px-8"
          >
            <div className="flex items-center gap-x-2">
              <VscSignOut className="text-lg" />
              <span>Logout</span>
            </div>
          </button>
        </div>
      </div>
      {confirmationModal && <ConfirmationModal modalData={confirmationModal} />}
    </>
  )
}
