"use client";

import React from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal = ({ isOpen, onClose }: LoginModalProps) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} showCloseButton={false} size="sm">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
          <i className="fas fa-lock text-2xl text-blue-900"></i>
        </div>
        <h3 className="mb-2 text-xl font-bold text-gray-800">Login Required</h3>
        <p className="mb-6 text-gray-600">
          Please login or create an account to add services to your cart and apply.
        </p>
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Link href="/login" className="flex-1">
            <Button className="w-full bg-blue-900 hover:bg-blue-800">
              Login
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <Link
            href="/register"
            className="font-semibold text-blue-900 hover:underline"
          >
            Register here
          </Link>
        </p>
      </div>
    </Modal>
  );
};
