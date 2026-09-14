import { NextRequest, NextResponse } from 'next/server';

/**
 * Pinata IPFS Upload Handler
 * Supports uploading binary images and ERC-721 metadata JSON to Pinata IPFS
 */
export async function POST(req: NextRequest) {
  try {
    const pinataJwt = process.env.PINATA_JWT;

    const contentType = req.headers.get('content-type') || '';

    // If uploading a JSON metadata payload
    if (contentType.includes('application/json')) {
      const body = await req.json();

      if (!pinataJwt) {
        return NextResponse.json(
          {
            error: 'PINATA_JWT is not configured in .env.local',
            hint: 'Add your Pinata JWT to .env.local to enable real IPFS pinning, or use a custom IPFS CID.',
          },
          { status: 400 }
        );
      }

      const res = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${pinataJwt.trim().replace(/^Bearer\s+/i, '')}`,
        },
        body: JSON.stringify({
          pinataContent: body.metadata,
          pinataMetadata: {
            name: body.name ? `${body.name}-metadata.json` : 'nft-metadata.json',
          },
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Pinata JSON upload failed: ${errText}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      return NextResponse.json({
        ipfsHash: data.IpfsHash,
        tokenURI: `ipfs://${data.IpfsHash}`,
      });
    }

    // If uploading a file (multipart/form-data)
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json({ error: 'No valid file provided' }, { status: 400 });
      }

      if (!pinataJwt) {
        return NextResponse.json(
          {
            error: 'PINATA_JWT is not configured in .env.local',
            hint: 'Add your Pinata JWT to .env.local to enable IPFS image uploads.',
          },
          { status: 400 }
        );
      }

      const pinataFormData = new FormData();
      pinataFormData.append('file', file);

      const metadata = JSON.stringify({
        name: (file as File).name || 'nft-artwork',
      });
      pinataFormData.append('pinataMetadata', metadata);

      const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${pinataJwt.trim().replace(/^Bearer\s+/i, '')}`,
        },
        body: pinataFormData,
      });

      if (!res.ok) {
        const errText = await res.text();
        return NextResponse.json(
          { error: `Pinata file upload failed: ${errText}` },
          { status: res.status }
        );
      }

      const data = await res.json();
      return NextResponse.json({
        ipfsHash: data.IpfsHash,
        ipfsUrl: `ipfs://${data.IpfsHash}`,
      });
    }

    return NextResponse.json({ error: 'Unsupported Content-Type' }, { status: 415 });
  } catch (err: any) {
    console.error('Pinata upload error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
