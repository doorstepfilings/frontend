"use client";

import { Dialog, Transition } from "@headlessui/react";
import { Fragment } from "react";
import { ServiceApplication } from "./service-application";

interface ApplyServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: any;
}

export function ApplyServiceModal({ isOpen, onClose, service }: ApplyServiceModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-[100]" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 sm:p-6 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95 translate-y-8"
              enterTo="opacity-100 scale-100 translate-y-0"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100 translate-y-0"
              leaveTo="opacity-0 scale-95 translate-y-8"
            >
              <Dialog.Panel className="w-full max-w-5xl transform overflow-hidden rounded-[2.5rem] bg-white p-8 sm:p-12 text-left align-middle shadow-2xl transition-all border border-white/20 relative">
                
                {/* Close Button */}
                <button 
                    onClick={onClose}
                    className="absolute top-8 right-8 w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-50 text-slate-400 hover:bg-slate-100 hover:text-slate-900 transition-all z-10"
                >
                    <i className="fas fa-times text-xl"></i>
                </button>

                <div className="mb-10">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-2">Apply for Service</h2>
                    <p className="text-slate-500 font-bold">Please fill in the details below to start your application for <span className="text-blue-900">{service?.name}</span></p>
                </div>

                <ServiceApplication 
                    modalMode={true} 
                    onModalClose={onClose} 
                    preselectedService={service} 
                />

              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
